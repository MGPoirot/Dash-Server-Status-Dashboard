# Schedule

Generated: 10-01-2026 03:10

- Configs: `/opt/dash/Dash-Server-Status-Dashboard-main/content/configs`
- Runner: `/opt/dash/Dash-Server-Status-Dashboard-main/tools/runner.py`
- Max workers: `4`
- Max starts/sec: `2`
- Jitter (stable): `0..10s`
- Overlap policy: `coalesce` (skip if still running)

| metric | schedule | next run | last run | last_exit | last_dur_ms |
|---|---|---|---|---:|---:|
| <a href="/backup_glacier-sender_status">Z → Glacier</a> | daily | 00:00 | 02:35 | 0 | 1000 |
| <a href="/backup_glacier_age">Z → Glacier</a> | daily | 00:00 | 02:35 | 0 | 999 |
| <a href="/backup_immich-archive_age">Immich X → Z</a> | daily | 00:00 | 02:35 | 0 | 999 |
| <a href="/backup_immich-rsync_age">Immich Rsync X → Y </a> | daily | 00:00 | 02:35 | 0 | 995 |
| <a href="/backup_lilnasx-to-lilnasy_age">Rsync X → Y</a> | daily | 00:00 | 02:35 | 0 | 1000 |
| <a href="/backup_rsnapshot-archive_age-days">Rsnapshot X → Z</a> | daily | 00:00 | 02:35 | 0 | 1000 |
| <a href="/backup_rsnapshot-rsync_age">Rsnapshot X → Y</a> | hourly | 04:00 | 03:00 | 0 | 1004 |
| <a href="/immich_fleur_days-since">Immich Fleur</a> | twice-daily | 12:00 | 02:35 | 0 | 999 |
| <a href="/immich_library_total-items">Immich Media</a> | daily | 00:00 | 02:35 | 0 | 995 |
| <a href="/immich_maarten_days-since">Immich Maarten</a> | twice-daily | 12:00 | 02:35 | 0 | 999 |
| <a href="/media_plex-movies_count">Plex Movies</a> | weekly | Jan 15 | 02:35 | 0 | 999 |
| <a href="/network_connectivity_status">Network Status</a> | five-minutely | 03:15 | 03:10 | 0 | 1002 |
| <a href="/plex_music-library_track-count">Plex Tracks</a> | hourly | 04:00 | 03:00 | 0 | 2003 |
| <a href="/services_plex-music_days-since-last-add">Last Plex Add</a> | twice-daily | 12:00 | 02:35 | 0 | 995 |
| <a href="/storage_2tb-hdd_lifetime-pct">Y Lifetime</a> | hourly | 04:00 | 03:00 | 0 | 1001 |
| <a href="/storage_8tb-hdd_io-latency">X Latency</a> | quarter-hourly | 03:15 | 03:00 | 0 | 1002 |
| <a href="/storage_8tb-hdd_lifetime-pct">X Lifetime</a> | daily | 00:00 | 02:35 | 0 | 1000 |
| <a href="/storage_disk2_used">Y Used</a> | twice-daily | 12:00 | 02:35 | 0 | 998 |
| <a href="/storage_disk2_used-pct">Y Used</a> | twice-daily | 12:00 | 02:35 | 0 | 999 |
| <a href="/storage_hard-disk-1_used">X Used</a> | twice-daily | 12:00 | 02:35 | 0 | 998 |
| <a href="/storage_hard-disk-1_used-prc">X Used</a> | twice-daily | 12:00 | 02:35 | 0 | 999 |
| <a href="/storage_hdd-2tb_io-latency">Y Latency</a> | half-hourly | 03:30 | 03:00 | 0 | 1000 |
| <a href="/storage_root_used-pct">OS Drive Used</a> | half-hourly | 03:30 | 03:00 | 0 | 1001 |
| <a href="/storage_system-ssd_used-gb">OS Drive Used</a> | twice-daily | 12:00 | 02:35 | 0 | 1003 |
| <a href="/syncthing_whatsapp-media_received-count">Syncthing Media</a> | daily | 00:00 | 02:35 | 0 | 1000 |
| <a href="/system_cpu_iowait">CPU I/O Wait</a> | quarter-hourly | 03:15 | 03:00 | 0 | 2000 |
| <a href="/system_cpu_temp">CPU Temperature</a> | five-minutely | 03:15 | 03:10 | 0 | 1002 |
| <a href="/system_host_uptime">Uptime</a> | hourly | 04:00 | 03:00 | 0 | 999 |
| <a href="/system_memory_usedpct">RAM Used</a> | five-minutely | 03:15 | 03:10 | 0 | 1001 |
| <a href="/system_os_version">OS Version</a> | bi-daily | 00:00 | 02:35 | 0 | 1020 |
| <a href="/system_swap_usedpct">Swap Used</a> | five-minutely | 03:15 | 03:10 | 0 | 1002 |
| <a href="/updates_watchtower_up">Watchtower Status</a> | daily | 00:00 | 02:35 | 0 | 1020 |
