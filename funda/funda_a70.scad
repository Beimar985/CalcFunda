// =====================================================================
//  Funda calculadora científica para Samsung Galaxy A70
//  Piezas:  "carcasa"  (TPU 95A)  — sostiene el celular, deja libre la cámara
//           "placa"    (PLA/PETG) — tapa frontal a presión, ventana del display y agujeros de teclas
//           "membrana" (TPU 95A)  — lámina resorte que sostiene las teclas
//           "teclas"   (PLA conductor, o PLA normal + cinta de cobre)
//  Exportar: openscad -D 'PART="placa"' -o placa.stl funda_a70.scad
//  ¡MIDE TU CELULAR CON VERNIER Y AJUSTA LOS VALORES DE "CELULAR" ANTES DE IMPRIMIR!
// =====================================================================

PART = "ensamble";   // carcasa | placa | membrana | teclas | ensamble
$fn = 32;
FONT = "DejaVu Sans:style=Bold";

// ---------- CELULAR (Galaxy A70, valores de ficha; verificar) ----------
PW = 76.7;    // ancho
PH = 164.3;   // alto
PT = 7.9;     // grosor
PR = 8.0;     // radio de esquinas
SX = 3.45;    // borde izq. del celular -> borde izq. de la pantalla
SY = 3.8;     // borde sup. del celular -> borde sup. de la pantalla
SCREEN_W = 69.8;

// cámara trasera (vista de frente: queda arriba a la DERECHA)
CAM_X0 = 5;  CAM_W = 16;   // desde el borde derecho
CAM_Y0 = 4;  CAM_H = 40;   // desde el borde superior
// botones (lado derecho) y puertos (abajo), medidos desde el borde superior / izquierdo
BTN_Y0 = 28; BTN_Y1 = 95;
PORT_X0 = 12; PORT_X1 = 65;

// ---------- CARCASA ----------
CL   = 0.2;   // holgura celular-carcasa
WALL = 1.8;
BACK = 1.6;
LIP  = 1.6;   // ceja que sujeta el vidrio
LIPH = 0.8;
RISE = 2.6;   // altura de la pared sobre el vidrio (espacio para teclas)
ZG = BACK + PT;     // plano del vidrio
ZT = ZG + RISE;     // borde superior de la carcasa = cara inferior de la placa

// ---------- PLACA ----------
PLT  = 3.0;   // espesor
CHF  = 1.2;   // chaflán del borde superior de la placa
SKC  = 0.25;  // holgura de la falda
SKW  = 1.6;   // pared de la falda
SKD  = 3.0;   // profundidad de la falda
ENG  = 0.5;   // profundidad del grabado

// ---------- TECLADO: distribución en layout.scad (generada por gen_layout.py, igual que la app) ----------
include <layout.scad>
HOLE = 0.6;                            // holgura agujero placa
FLW = 1.4; FLT = 0.6;                  // pestaña de retención bajo la placa
MAT = 0.6;                             // espesor membrana
GAP = 0.7;                             // punta -> vidrio en reposo (recorrido)
PROT = 1.8;                            // cuánto sobresale la tecla de la placa
KR = 1.3;                              // radio esquinas tecla
BOSS = 3.0; PIN = 2.0; PINHOLE = 2.3;

Z_FL  = ZT - FLT;          // inicio de la pestaña
Z_MAT = Z_FL - MAT;        // cara inferior de la membrana
Z_TIP = ZG + GAP;          // punta en reposo
function NECKD(k) = min(min(k[2], k[3]) - 0.8, 6.5);

// ---------- utilidades ----------
// pantalla (x derecha, y abajo) -> celular (x derecha, y arriba)
function P(sx, sy) = [SX + sx, PH - (SY + sy)];
function KC(k) = P(k[0], k[1]);

module outline(o) { offset(r = PR + o) offset(delta = -PR) square([PW, PH]); }
module rrect(w, h, r) { offset(r = r) offset(delta = -r) square([w, h], center = true); }
function tsize(k) = min(k[3] * (k[6] == "d" ? 0.48 : 0.36), (k[2] - 1.6) / max(1, len(k[4])) * 1.45);

// =====================================================================
module carcasa() {
  difference() {
    union() {
      // fondo + paredes hasta ZT
      linear_extrude(ZT) outline(CL + WALL);
    }
    // hueco del celular
    translate([0,0,BACK]) linear_extrude(PT + 0.01) outline(CL);
    // por encima de la ceja
    translate([0,0,ZG + LIPH]) linear_extrude(RISE) outline(CL);
    // abertura de la ceja (pantalla)
    translate([0,0,ZG - 0.1]) linear_extrude(LIPH + 0.2) outline(-LIP);
    // cámara
    translate([PW - CAM_X0 - CAM_W, PH - CAM_Y0 - CAM_H, -1])
      linear_extrude(BACK + 2) offset(r = 4) offset(delta = -4) square([CAM_W, CAM_H]);
    // botones laterales
    translate([PW - 1, PH - BTN_Y1, BACK + 1.6]) cube([WALL + CL + 3, BTN_Y1 - BTN_Y0, 4.8]);
    // puertos inferiores
    translate([PORT_X0, -WALL - 2, BACK + 1.0]) cube([PORT_X1 - PORT_X0, WALL + CL + 3, 5.9]);
    // micrófono superior
    translate([PW/2, PH - 1, BACK + PT/2]) rotate([-90,0,0]) cylinder(d = 2.2, h = WALL + 3);
  }
}

// =====================================================================
module placa() {
  difference() {
    union() {
      translate([0,0,ZT]) linear_extrude(PLT - CHF) outline(CL + WALL + SKC + SKW);
      for (i = [0:5]) translate([0,0,ZT + PLT - CHF + i*CHF/6]) linear_extrude(CHF/6 + 0.01)
        outline(CL + WALL + SKC + SKW - (i+1)*CHF/6);
      // falda
      translate([0,0,ZT - SKD]) linear_extrude(SKD + 0.01)
        difference() { outline(CL + WALL + SKC + SKW); outline(CL + WALL + SKC); }
      // nervio perimetral + bosses que sujetan la membrana
      translate([0,0,Z_FL]) linear_extrude(FLT + 0.01) {
        difference() { mat_outline(0); mat_outline(-1.5); }
        for (p = PINS) translate(P(p[0], p[1])) circle(d = BOSS);
      }
      translate([0,0,Z_MAT]) linear_extrude(MAT + 0.01) for (p = PINS) translate(P(p[0], p[1])) circle(d = PIN);
    }
    // ventana del display
    translate(concat(P(LCD[0], LCD[1] + LCD[3]), [ZT - 1]))
      linear_extrude(PLT + 2) offset(r = 1.5) offset(delta = -1.5) square([LCD[2], LCD[3]]);
    // marco grabado alrededor del display
    translate(concat(P(LCD[0] - 2.2, LCD[1] + LCD[3] + 2.2), [ZT + PLT - ENG])) linear_extrude(ENG + 1)
      difference() {
        offset(r = 2.5) offset(delta = -2.5) square([LCD[2] + 4.4, LCD[3] + 4.4]);
        translate([0.6, 0.6]) offset(r = 2.0) offset(delta = -2.0) square([LCD[2] + 3.2, LCD[3] + 3.2]);
      }
    // agujeros de teclas
    for (k = KEYS) translate(concat(KC(k), [ZT - 1]))
      linear_extrude(PLT + 2) rrect(k[2] + HOLE, k[3] + HOLE, KR + HOLE/2);
    // etiquetas SHIFT grabadas sobre cada tecla
    for (k = KEYS) if (k[5] != "")
      translate(concat(KC(k) + [0, (k[3] + HOLE)/2 + 1.25], [ZT + PLT - ENG]))
        linear_extrude(ENG + 1) text(k[5], size = 1.6, font = FONT, halign = "center", valign = "center");
    // línea que separa funciones del bloque numérico
    translate(concat(P(3, SEP_Y), [ZT + PLT - ENG])) translate([0, -0.3]) cube([SCREEN_W - 6, 0.6, ENG + 1]);
    // nombre arriba (diseño propio)
    translate(concat(P(LCD[0] + 1, 2.6), [ZT + PLT - ENG]))
      linear_extrude(ENG + 1) text("CALC-70", size = 2.6, font = FONT, halign = "left", valign = "center");
    translate(concat(P(LCD[0] + LCD[2] - 1, 2.6), [ZT + PLT - ENG]))
      linear_extrude(ENG + 1) text("SCIENTIFIC", size = 2.0, font = FONT, halign = "right", valign = "center");
    // panel "solar" decorativo abajo
    translate(concat(P(SCREEN_W/2 - 16, 152), [ZT + PLT - ENG])) linear_extrude(ENG + 1)
      difference() { square([32, 7]); translate([0.7, 0.7]) square([30.6, 5.6]); }
    for (i = [1:3]) translate(concat(P(SCREEN_W/2 - 16 + 8*i, 152), [ZT + PLT - ENG])) translate([-0.25, 0]) cube([0.5, 7, ENG + 1]);
    translate(concat(P(SCREEN_W/2, 138.5), [ZT + PLT - ENG]))
      linear_extrude(ENG + 1) text("2-LINE  DISPLAY", size = 1.8, font = FONT, halign = "center", valign = "center");
  }
}

// =====================================================================
module mat_outline(o) {
  translate(P(MATR[0] - o, MATR[1] + MATR[3] + o)) offset(r = 2) offset(delta = -2)
    square([MATR[2] + 2*o, MATR[3] + 2*o]);
}

module membrana(flat = false) {
  translate([0,0, flat ? 0 : Z_MAT]) linear_extrude(MAT) difference() {
    mat_outline(0);
    for (k = KEYS) translate(KC(k)) circle(d = NECKD(k) - 0.4, $fn = 40);
    for (p = PINS) translate(P(p[0], p[1])) circle(d = PINHOLE);
  }
}

// =====================================================================
// Tecla en posición de uso (z = 0 en la punta)
TECLA_ALTO = (ZT + PLT + PROT) - Z_TIP;
module tecla(k) {
  hcap = PLT + PROT;   // tramo que atraviesa la placa
  difference() {
    union() {
      cylinder(d = NECKD(k), h = Z_FL - Z_TIP + 0.01, $fn = 40);                      // punta + cuello
      translate([0,0, Z_FL - Z_TIP]) linear_extrude(FLT) rrect(k[2] + FLW, k[3] + FLW, KR + FLW/2); // pestaña
      translate([0,0, ZT - Z_TIP]) linear_extrude(hcap - 0.6) rrect(k[2], k[3], KR);  // cuerpo
      for (i = [0:2]) translate([0,0, ZT - Z_TIP + hcap - 0.6 + i*0.2])                 // borde redondeado
        linear_extrude(0.21) rrect(k[2] - [0.15,0.4,0.8][i]*2, k[3] - [0.15,0.4,0.8][i]*2, max(0.3, KR - [0.15,0.4,0.8][i]));
    }
    translate([0,0, TECLA_ALTO - ENG]) linear_extrude(ENG + 1)
      text(k[4], size = tsize(k), font = FONT, halign = "center", valign = "center");
  }
}

// Todas las teclas acostadas para imprimir (cara superior contra la cama), en su misma posición relativa
module teclas_impresion(grupos = "cpfdna") {
  for (k = KEYS) if (search(k[6], grupos) != []) translate(concat(KC(k), [TECLA_ALTO])) rotate([180,0,0]) tecla(k);
}

// =====================================================================
if (PART == "carcasa")  carcasa();
if (PART == "placa")    translate([0,0, ZT + PLT]) rotate([180,0,0]) translate([0,0,0]) placa();  // cara superior abajo
if (PART == "membrana") membrana(true);
if (PART == "teclas")   teclas_impresion();
// por color: control y flechas (gris), funciones (negro), números (blanco), operaciones (gris oscuro), DEL/AC (color acento)
if (PART == "teclas_control")     teclas_impresion("cp");
if (PART == "teclas_funciones")   teclas_impresion("f");
if (PART == "teclas_numeros")     teclas_impresion("d");
if (PART == "teclas_operaciones") teclas_impresion("n");
if (PART == "teclas_del_ac")      teclas_impresion("a");
if (PART == "ensamble") {
  color("dimgray") carcasa();
  color("white", 0.9) placa();
  color("orange") membrana();
  for (k = KEYS) translate(concat(KC(k), [Z_TIP])) color("black") tecla(k);
}
