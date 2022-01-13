# Changelog

## 2.0.0 (13-01-2022)

### Added

-   [#26] Automaton is now done with transitions
-   max_annotations: limit is now disabled when option is set to <1 (new default is -1)

### Removed

-   [#26] Xstate and typescript state machine and protocol was removed
-   app/static/settings.ts not needed anymore
-   Time tracking for each task got removed but will be added later again

### Changed

-   [#26]
    -   client server communication completely reworked
    -   individual tasks from xstate automaton got refactored
    -   protocol is now defined with yaml and has a new format (refer to wiki)
-   [#29] Using webpack instead of gulp
-   Using app factory instead of global app variable (allows pytest to work)
-   Password hashing is now done with bcrypt and adequate salting

### Fixed

-   UI loading is now more stable
