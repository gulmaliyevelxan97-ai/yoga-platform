"""Run with python3 scripts/test-booking-race.py as an unprivileged user with
PostgreSQL 16+ binaries (initdb, pg_ctl and psql) on PATH. Creates and removes
its own temporary cluster. Never connects to an existing project.
"""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]


def main():
    for binary in ("initdb", "pg_ctl", "psql"):
        if not shutil.which(binary):
            raise SystemExit(f"Missing {binary}. Install PostgreSQL server and client locally.")
    if os.getuid() == 0:
        raise SystemExit("Run as an unprivileged OS user for initdb.")
    # libpq honors numerous PG* variables; keep connection settings isolated.
    env = {key: value for key, value in os.environ.items() if not key.startswith("PG")}
    with tempfile.TemporaryDirectory(prefix="restart-pg-") as temp:
        data = Path(temp) / "data"
        env.update(PGHOST=temp, PGPORT="5432", PGUSER="postgres", PGDATABASE="postgres",
                   PGCLIENTENCODING="UTF8", LC_ALL="C")
        subprocess.run(["initdb", "-D", data, "-U", "postgres", "-A", "trust",
                        "--no-locale", "--encoding=UTF8"], env=env, check=True, stdout=subprocess.DEVNULL)
        subprocess.run(["pg_ctl", "-D", data, "-l", str(Path(temp) / "pg.log"), "-w",
                        "-o", f"-k {temp} -c listen_addresses='' -p 5432", "start"], env=env, check=True)
        psql = ["psql", "-XqAt", "-v", "ON_ERROR_STOP=1"]
        def run(sql):
            return subprocess.run(psql, input=sql, text=True, capture_output=True,
                                  env=env, check=True, timeout=15).stdout.strip()
        first = second = None
        try:
            run("""create role anon; create role authenticated; create role supabase_auth_admin;
                create schema auth; create table auth.users(id uuid primary key);
                create function auth.jwt() returns jsonb language sql stable as $$
                select nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
                create function auth.uid() returns uuid language sql stable as $$
                select (auth.jwt()->>'sub')::uuid $$;
                grant usage on schema auth to anon,authenticated;""")
            for migration in sorted((ROOT / "supabase/migrations").glob("*.sql")):
                run(migration.read_text())
            teacher, student_a, student_b, slot = [str(uuid.uuid4()) for _ in range(4)]
            run(f"""insert into auth.users values ('{teacher}'),('{student_a}'),('{student_b}');
                insert into public.restart_class_sessions(id,instructor_id,title,starts_at,ends_at,format,kind,capacity)
                values ('{slot}','{teacher}','fixture',now()+interval '1 day',now()+interval '2 days','online','individual',1);""")
            def booking(student):
                return f"""set role authenticated;
                    set request.jwt.claims = '{{"sub":"{student}","is_anonymous":false}}';
                    select public.restart_set_booking('{slot}', true);"""
            first = subprocess.Popen(psql, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE, text=True, env={**env, "PGAPPNAME":"restart-winner"})
            first.stdin.write("begin;\n" + booking(student_a) + "\n")
            first.stdin.flush()
            for _ in range(100):
                if run("""select count(*) from pg_stat_activity where application_name='restart-winner'
                         and state='idle in transaction' and query like '%select public.restart_set_booking%'""") == "1":
                    break
                if first.poll() is not None:
                    raise RuntimeError("First transaction failed to reserve")
                time.sleep(0.05)
            else:
                raise RuntimeError("First transaction failed to hold its reservation")
            second = subprocess.Popen(psql + ["-c", booking(student_b)], stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE, text=True, env={**env, "PGAPPNAME":"restart-contender"})
            for _ in range(100):
                if run("select count(*) from pg_stat_activity where application_name='restart-contender' and wait_event_type='Lock';") == "1":
                    break
                if second.poll() is not None:
                    raise RuntimeError("Contender exited before waiting on the uncommitted booking")
                time.sleep(0.05)
            else:
                raise RuntimeError("Contender failed to reach the lock wait")
            output, error = first.communicate("commit;\n", timeout=10)
            if first.returncode or output.strip() != "booked":
                raise RuntimeError(f"First transaction failed: {error}")
            _, error = second.communicate(timeout=10)
            if not second.returncode or "Class full" not in error:
                raise RuntimeError(f"Unexpected result for contender: {error}")
            if run("select seats_taken from public.restart_class_sessions") != "1":
                raise RuntimeError("Unexpected seat count")
            if run("select user_id from public.restart_bookings where status='booked'") != student_a:
                raise RuntimeError("Unexpected final roster")
            print("PASS: the contender waited, the winning reservation committed, and one seat was booked.")
        finally:
            for process in (first, second):
                if process and process.poll() is None:
                    process.kill()
                    process.wait()
            subprocess.run(["pg_ctl","-D",data,"-m","immediate","-w","stop"],env=env,check=True)


if __name__ == "__main__":
    main()
