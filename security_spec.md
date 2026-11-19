# Security Specification — SkillGraph / C60 Demo

## 1. Data Invariants
1. **Default-Deny Baseline**: Every path not explicitly matched is denied for all reads and writes.
2. **No Collection Enumeration (`allow list: if false`)**: Blanket listing of `/demoSessions` and `/rooms` is denied so callers must know an exact document ID or room code.
3. **Passwordless Demo Access**: Per user specification for multi-browser demo walkthroughs, no Firebase Authentication sign-in gate is required for `/demoSessions/{sessionId}` or `/rooms/{roomCode}`.
4. **Strict Schema & Size Bounds**:
   - `/rooms/{roomCode}` requires `roomCode` matching `^[A-Z0-9]{4,6}$`, exact key set (`code`, `teamName`, `theme`, `stage`, `version`, `state`, `createdAt`, `updatedAt`), bounded strings (`teamName` 1..40, `theme` 1..80), valid C60 `stage`, and `state.code == roomCode` / `state.stage == stage`.
   - `/demoSessions/{sessionId}` requires valid ID (`^[a-zA-Z0-9_\-]+$`), exact key set (`activeCode`, `updatedAt`), valid `activeCode` (`^[A-Z0-9]{4,6}$`), and `updatedAt == request.time`.
5. **Lifecycle & Version Monotonicity**:
   - On `create` of `/rooms/{roomCode}`, `version == 1` and `createdAt == updatedAt == request.time`.
   - On `update` of `/rooms/{roomCode}`, `code` and `createdAt` are immutable, `updatedAt == request.time`, `version == existing().version + 1`, and only `['teamName', 'theme', 'stage', 'version', 'state', 'updatedAt']` may change.
   - Deletes are disabled on `/demoSessions` and `/rooms`.
