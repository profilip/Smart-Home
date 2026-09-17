// ============================================================
//  NEMA 17 String Winding Spool
// ============================================================
//  Customizable spool/wheel for winding string onto a NEMA 17
//  stepper motor D-shaft (5mm diameter with D-flat).
//
//  Print Settings:
//    - Layer height: 0.2mm
//    - Infill:       40%+ (higher = stronger grip on shaft)
//    - Material:     PLA or PETG
//    - Supports:     None needed
// ============================================================

// ---- USER SETTINGS (all values in mm) ----------------------

// Spool barrel (the part string winds onto)
barrel_diameter  = 30;   // Outer diameter of the winding drum
barrel_height    = 30;   // Height / width of the winding section

// Flanges (the side discs that keep string on the drum)
flange_diameter  = 50;   // Outer diameter of side flanges
flange_thickness =  4;   // Thickness of each flange

// NEMA 17 D-shaft specs
shaft_diameter   =  5.2; // 5mm + 0.2mm clearance
shaft_flat_depth =  0.5; // Depth of the D-flat cut (standard NEMA 17)

// Hub: the solid cylinder the shaft inserts into
hub_height       = 20;   // How deep the shaft inserts (more = more grip)
hub_diameter     = 12;   // Outer diameter of the hub collar

// M3 grub screw hole (optional — helps lock shaft)
add_grub_screw   = true;  // Set to false to skip
grub_screw_dia   =  3.2;  // M3 = 3.2mm drill

// ---- DERIVED VALUES ----------------------------------------
barrel_radius  = barrel_diameter  / 2;
flange_radius  = flange_diameter  / 2;
hub_radius     = hub_diameter     / 2;
shaft_radius   = shaft_diameter   / 2;

total_height = (flange_thickness * 2) + barrel_height;

// ---- D-SHAFT HOLE ------------------------------------------
// Uses intersection() to create a proper circle-with-one-flat-side
module d_shaft_hole(h) {
    intersection() {
        // Full round shaft
        cylinder(h = h, r = shaft_radius, $fn = 64);

        // Cube that clips the +X side to create the D-flat
        // It extends from well past -X up to (radius - flat_depth) on +X
        translate([-(shaft_radius + 1), -(shaft_radius + 1), -0.01])
            cube([
                (shaft_radius + 1) + (shaft_radius - shaft_flat_depth),
                shaft_diameter + 2,
                h + 0.02
            ]);
    }
}

// ---- GRUB SCREW HOLE ----------------------------------------
module grub_screw_hole() {
    // Horizontal M3 hole through the hub wall, perpendicular to D-flat
    rotate([0, 90, 0])
        translate([0, 0, -hub_radius - 1])
            cylinder(h = hub_radius + shaft_radius + 2,
                     r = grub_screw_dia / 2,
                     $fn = 32);
}

// ---- SPOOL ASSEMBLY -----------------------------------------
module spool() {
    // Hub starts at Z=0 and goes downward (-Z),
    // Spool body sits on top starting at Z=0 going up (+Z)
    difference() {
        union() {
            // Hub collar (extends downward below the spool)
            translate([0, 0, -hub_height])
                cylinder(h = hub_height, r = hub_radius, $fn = 64);

            // Bottom flange
            cylinder(h = flange_thickness, r = flange_radius, $fn = 128);

            // Barrel (winding drum)
            translate([0, 0, flange_thickness])
                cylinder(h = barrel_height, r = barrel_radius, $fn = 128);

            // Top flange
            translate([0, 0, flange_thickness + barrel_height])
                cylinder(h = flange_thickness, r = flange_radius, $fn = 128);
        }

        // D-shaft hole through the entire hub + into the barrel
        translate([0, 0, -hub_height - 0.5])
            d_shaft_hole(hub_height + flange_thickness + 1);

        // M3 grub screw hole in the hub (at mid-height of hub)
        if (add_grub_screw) {
            translate([0, 0, -hub_height / 2])
                grub_screw_hole();
        }

        // String anchor hole through the barrel wall
        // (thread your string end through here and knot it)
        translate([0, 0, flange_thickness + barrel_height / 2])
            rotate([0, 90, 0])
                cylinder(h = barrel_radius + 2, r = 1.5, $fn = 32);
    }
}

// ---- RENDER -------------------------------------------------
spool();
