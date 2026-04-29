# Security & config

## LAN assumptions

Default posture: **trusted LAN, minimal auth**.

- Chair controls require a `chair_key`.
- Nodes do not require per-node tokens in the MVP.

## Future hardening (recommended)

- Pairing codes for nodes.
- Per-node tokens and permissions (speaker vs spectator).
- Read-only spectator UI.
- TLS termination via reverse proxy.

