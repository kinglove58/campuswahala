# ADR 007: Bounded guest retention worker

Status: Accepted and executable for PostgreSQL/local worker.

The worker runs cleanup at startup and every one minute when PLAYER_STORE=postgres; memory mode has no separate worker store. Each sweep captures one clock cutoff, deletes at most ten batches of 500, and does not overlap itself. SQL uses expiry/id ordering, LIMIT and FOR UPDATE SKIP LOCKED in one parameterized DELETE statement. The composite index supports candidate selection. Multiple workers are safe; concurrent sweeps skip locked rows. Rows expiring later than the captured cutoff remain untouched. The operation is idempotent; guest reads still enforce expiry independently.

Only deleted count and completion/failure event are logged, never tokens/IPs/player fields. Bounded backlog can require multiple sweeps; no strict retention SLA until deployment cadence, alerts and capacity are proven. Configure a production worker/ACA scheduled job later; no paid scheduler is provisioned here. Injected-clock memory tests and PostgreSQL concurrent bounded-batch tests verify behavior. Shutdown waits for the current sweep and closes the connection. Production database principal needs DELETE/SELECT on guests, not schema migration rights.

The current cadence requires a running process: scale-to-zero idle workers cannot guarantee an interval. Production must use a monitored scheduled job or an explicitly budgeted running worker. Worker configuration requires only environment/store/database, never API session or bridge signing secrets.
