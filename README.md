# DUET STEM LMS media: backup copy

This branch keeps every LMS video, picture and 3D model that used to be published from `main`
(the 72 lesson videos, `walkthrough/`, `assets/` and `plates.js`), so nothing is lost.

The LMS now plays them from its own site: **https://duetpower.in/lms/media/** (and `/lms/media/2/` for
the files of the `duet-lms-media-2` repository). `media-manifest.json` lists every file with its size,
SHA-1 and where it is copied from; `duetpower.in/lms/media/media-sync.php` uses it to copy anything
missing or changed.

The apps (Science, Maths, Space, Human Body, Drone, Robotics …) stay on `main` and on GitHub Pages.
