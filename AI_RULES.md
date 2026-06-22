# AI_RULES.md

# Project Rules

## General

1. Use TypeScript everywhere.
2. Use Expo Managed Workflow.
3. Prefer simplicity over abstraction.
4. Build MVP first.

## Architecture

5. Song is the primary domain object.
6. PDF is a child resource of Song.
7. All features must respect Song Package architecture.
8. Follow Offline First principles.

## Code Quality

9. Strict TypeScript mode.
10. No any unless unavoidable.
11. Components under 300 lines.
12. Reusable UI components.
13. Separate business logic from UI.

## Development

14. Do not implement Future Features during MVP.
15. Do not implement MusicXML during MVP.
16. Do not implement Transpose during MVP.
17. Focus on PDF workflows first.

## State Management

18. Keep state predictable.
19. Avoid unnecessary global state.
20. Prefer feature-based architecture.

## UX

21. Library is the primary screen.
22. Fast PDF loading is critical.
23. Offline experience is critical.
24. Real performance is more important than visual effects.

## Task Management

25. Update TASKS.md after completing work.
26. Update PROGRESS.md after major milestones.
27. Create TODO items for unresolved issues.
28. Never silently skip tasks.

## Product Philosophy

29. Users manage Songs, not PDFs.
30. Every decision should improve live performance workflow.
31. Optimize for church musicians and performers.
32. Avoid features that increase complexity without improving performance workflow.
