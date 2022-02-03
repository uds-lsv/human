# Changelog

## 2.0.1 (tbd)

### Added

-   `flask create-upload-file` automatically create a upload file containing filepaths from a directory
-   Polygon Task: Draw and modify polygons on an image.
-   new examples for annotation protocols

### Removed

### Changed

-   darkmode is now the default
-   node is only required for development from now on
    -   dist folder contains minified js and css
    -   when developing client side node is still needed for webpack
-   transfer source code out of static folder
    -   client source code is now in separate /client folder
    -   moved package.json and webpack scripts to /client
    -   npm scripts have to be started from /client
    -   transpiled, minified js and css files and assets remain in /app/static/dist

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
