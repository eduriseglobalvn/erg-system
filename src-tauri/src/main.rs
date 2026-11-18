// Release builds are a GUI app: without this Windows opens a console window next to the Player.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    erg_lms_desktop_lib::run();
}
