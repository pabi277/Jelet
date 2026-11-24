# JELET 2025 Paper-I Set A — question data, validated against WBJEEB Final Answer Key JEEB/Reg-171/25.
# Q1–Q25: verbatim visual transcription from 180-DPI renders of the official Set A booklet (PDF pages 2–6).
# Q26–Q100: pending visual re-verification in later batches.
# Each entry: (qNumber, subjectId, unitId, category, pdfPage, stemLatex, {A,B,C,D: latex}, correct(list), difficulty, tags, figureKeyOrNone)

Q2025 = [
# ---------------- MATHEMATICS Cat-I (Q1-30) ----------------
(1,"MATH","M03",1,2,
 "Let $Z$ be a complex number such that $Z^{4} - Z^{3} + 2Z^{2} - Z + 1 = 0$. The value of $|Z|$ is",
 {"A":"$\\dfrac{1}{4}$","B":"$\\dfrac{1}{2}$","C":"$\\dfrac{3}{4}$","D":"$1$"},
 ["D"],"medium",["complex-modulus", "quartic-factorisation", "roots-of-unity"],None),

(2,"MATH","M01",1,2,
 "If $\\omega\\,(\\neq 1)$ be a cube root of unity and $A = \\begin{bmatrix} \\omega & 0 \\\\ 0 & \\omega \\end{bmatrix}$, then $A^{2025}$ is equal to",
 {"A":"$A$","B":"$-A$","C":"$I$","D":"$A^{2}$"},
 ["C"],"easy",["cube-root-unity", "matrix-power", "scalar-matrix"],None),

(3,"MATH","M01",1,2,
 "If $A$ and $B$ both are symmetric matrices, then $AB - BA$ is a",
 {"A":"Skew symmetric matrix","B":"Symmetric matrix","C":"Diagonal matrix","D":"Null matrix"},
 ["A"],"easy",["symmetric", "skew-symmetric", "transpose"],None),

(4,"MATH","M02",1,2,
 "The number of values of $K$ for which the system of equations $(K + 1)x + 8y = 4K$, $Kx + (K + 3)y = 3K - 1$ has no solution is",
 {"A":"$0$","B":"$1$","C":"$2$","D":"$3$"},
 ["B"],"medium",["linear-system", "no-solution", "determinant"],None),

(5,"MATH","M08",1,2,
 "If $u = \\tan^{-1}\\!\\left(\\dfrac{x^{7} + y^{7}}{x}\\right)$, then the value of the expression $x\\dfrac{\\partial u}{\\partial x} + y\\dfrac{\\partial u}{\\partial y}$ is equal to",
 {"A":"$3\\sin 2u$","B":"$\\sin 2u$","C":"$5\\sin 2u$","D":"$7\\sin 2u$"},
 ["A"],"medium",["euler-theorem", "homogeneous-function", "inverse-trigonometric"],None),

(6,"MATH","M09",1,2,
 "The value of $\\displaystyle\\int_{-1}^{1} \\dfrac{x\\left(|x| + \\cos x + \\sin^{2} x\\right)}{\\left(\\sec^{2} x + |x| + x^{4}\\right)}\\,dx$ is",
 {"A":"$0$","B":"$1$","C":"$2$","D":"$-1$"},
 ["A"],"easy",["definite-integral", "odd-function", "symmetric-limits"],None),

(7,"MATH","M06",1,3,
 "If the function $f(x) = \\begin{cases} \\dfrac{x^{2} - (A+3)x + 3A}{x - 3}, & \\text{for } x \\neq 3 \\\\ 5, & \\text{for } x = 3 \\end{cases}$ is continuous at $x = 3$, then the value of $A$ is equal to",
 {"A":"$-5$","B":"$5$","C":"$-3$","D":"$-2$"},
 ["D"],"easy",["continuity", "limit", "removable-discontinuity"],None),

(8,"MATH","M06",1,3,
 "If $f(x) = \\dfrac{4^{x}}{4^{x} + 2}$, then $f(x) + f(1 - x)$ is equal to",
 {"A":"$2^{x}$","B":"$4$","C":"$2$","D":"$1$"},
 ["D"],"easy",["function", "symmetry", "exponential"],None),

(9,"MATH","M09",1,3,
 "If $g'(x) = g(x)$, then $\\displaystyle\\int g(x)\\left[f(x) + f'(x)\\right]dx$ has the value ($C_{1}$ is a constant of integration)",
 {"A":"$f'(x)g'(x) + C_{1}$","B":"$f'(x)g(x) + C_{1}$","C":"$f(x)g(x) + C_{1}$","D":"$f(x)g'(x) + C_{1}$"},
 ["C"],"easy",["integration", "product-rule", "by-parts"],None),

(10,"MATH","M10",1,3,
 "The general solution of $\\left(x^{4}e^{x} - 4xy^{2}\\right)dx + 4x^{2}y\\,dy = 0$, is ($C$ is a constant of integration.)",
 {"A":"$e^{x} = 2\\left(\\dfrac{y}{x}\\right)^{2} + C$","B":"$e^{x} + 2\\left(\\dfrac{y}{x}\\right)^{2} = C$","C":"$e^{x} + 4\\left(\\dfrac{y}{x}\\right)^{2} = C$","D":"$e^{x} + 2\\left(\\dfrac{x}{y}\\right)^{2} = C$"},
 ["B"],"medium",["ode", "exact-equation", "integrating-factor"],None),

(11,"MATH","M05",1,3,
 "The expression $\\vec{i} \\times \\left(\\vec{a} \\times \\vec{i}\\right) + \\vec{j} \\times \\left(\\vec{a} \\times \\vec{j}\\right) + \\vec{k} \\times \\left(\\vec{a} \\times \\vec{k}\\right)$ simplifies to",
 {"A":"$\\vec{0}$","B":"$\\vec{a}$","C":"$2\\vec{a}$","D":"$4\\vec{a}$"},
 ["C"],"medium",["vector-triple-product", "bac-cab", "cross-product"],None),

(12,"MATH","M06",1,3,
 "If $y = \\tan^{-1}\\dfrac{1}{1 + x + x^{2}} + \\tan^{-1}\\dfrac{1}{x^{2} + 3x + 3} + \\tan^{-1}\\dfrac{1}{x^{2} + 5x + 7} + \\cdots +$ up to $n$ terms, then $y'(0)$ is",
 {"A":"$\\dfrac{n^{2}}{n^{2} + 1}$","B":"$\\dfrac{-1}{n^{2} + 1}$","C":"$\\dfrac{-n^{2}}{1 + n^{2}}$","D":"$1$"},
 ["C"],"hard",["inverse-trigonometric", "telescoping-series", "derivative"],None),

(13,"MATH","M11",1,4,
 "A determinant is chosen at random from the set of all determinants of order $2$ with elements $0$ or $1$ only. The event that the determinant is non-zero has the probability",
 {"A":"$\\dfrac{3}{16}$","B":"$\\dfrac{3}{8}$","C":"$\\dfrac{1}{4}$","D":"$\\dfrac{1}{2}$"},
 ["B"],"medium",["classical-probability", "determinant", "counting"],None),

(14,"MATH","M04",1,4,
 "The number of common tangents to the circles $x^{2} + y^{2} = 4$ and $x^{2} + y^{2} - 6x - 8y = 24$ is",
 {"A":"$0$","B":"$1$","C":"$3$","D":"$4$"},
 ["B"],"medium",["circle", "common-tangents", "internal-tangency"],None),

(15,"MATH","M11",1,4,
 "There are two balls in an urn whose colours are not known but each ball is either white or black. A white ball is put into the urn and then a ball is drawn from the urn. The probability that it is white is",
 {"A":"$\\dfrac{1}{4}$","B":"$\\dfrac{1}{3}$","C":"$\\dfrac{2}{3}$","D":"$\\dfrac{1}{6}$"},
 ["C"],"medium",["total-probability", "urn", "conditional-probability"],None),

(16,"MATH","M04",1,4,
 "A line is drawn through the point $P(3, 11)$ to cut the circle $x^{2} + y^{2} = 9$ at $A$ and $B$. Then $PA.PB$ is equal to",
 {"A":"$9$","B":"$121$","C":"$205$","D":"$139$"},
 ["B"],"easy",["circle", "power-of-a-point", "secant"],None),

(17,"MATH","M06",1,4,
 "If $f(x) = a|\\sin 2x| + be^{|3x|} + c|2x|^{3}$, is differentiable at $x = 0$, then",
 {"A":"$2a + 3b = 0$","B":"$3b + 8c = 0$","C":"$a = b = c = 0$","D":"$a = 0$ and $c = 0$"},
 ["A"],"medium",["differentiability", "one-sided-derivative", "modulus"],None),

(18,"MATH","M06",1,4,
 "Let $f(x) = a^{x}\\ (a > 0)$ be written as $f(x) = g(x) + h(x)$, where $g(x)$ is even and $h(x)$ is odd. Then $g(x + y) + g(x - y)$ is equal to",
 {"A":"$2g(x)g(y)$","B":"$2g(x + y)g(x - y)$","C":"$2g(x)$","D":"$g(x)\\,h(x)$"},
 ["A"],"medium",["even-odd-decomposition", "functional-identity", "exponential"],None),

(19,"MATH","M05",1,5,
 "Let $\\vec{a} = \\lambda(\\vec{i} + \\vec{j} - \\vec{k})$ and $\\vec{b} = \\mu(\\vec{i} - \\vec{j} + \\vec{k})$ be two given vectors. $\\vec{c}$ is a unit vector perpendicular to $\\vec{a}$ but coplanar with $\\vec{a}$ and $\\vec{b}$. Then the unit vector $\\vec{d}$ perpendicular to both $\\vec{a}$ and $\\vec{c}$ is",
 {"A":"$\\dfrac{1}{\\sqrt{6}}\\left(2\\vec{i} - \\vec{j} + \\vec{k}\\right)$","B":"$\\dfrac{1}{\\sqrt{2}}\\left(\\vec{j} + \\vec{k}\\right)$","C":"$\\dfrac{1}{\\sqrt{6}}\\left(\\vec{i} - 2\\vec{j} + \\vec{k}\\right)$","D":"$\\dfrac{1}{\\sqrt{2}}\\left(\\vec{j} - \\vec{k}\\right)$"},
 ["B"],"medium",["cross-product", "coplanar-vectors", "unit-normal"],None),

(20,"MATH","M04",1,5,
 "The length of the tangent drawn from any point on the circle $x^{2} + y^{2} + 2gx + 2fy + \\alpha = 0$ to the circle $x^{2} + y^{2} + 2gx + 2fy + \\beta = 0$ is",
 {"A":"$\\sqrt{\\alpha - \\beta}$","B":"$\\sqrt{\\dfrac{\\alpha}{\\beta}}$","C":"$\\sqrt{\\beta - \\alpha}$","D":"$\\sqrt{\\alpha\\beta}$"},
 ["C"],"easy",["circle", "length-of-tangent", "concentric-circles"],None),

(21,"MATH","M02",1,5,
 "If $A = \\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}$, then the value of the determinant $\\left|A^{2009} - 5A^{2008}\\right|$ is",
 {"A":"$-5$","B":"$-6$","C":"$4$","D":"$-9$"},
 ["B"],"medium",["determinant", "product-rule-of-determinants", "matrix-power"],None),

(22,"MATH","M02",1,5,
 "If the system of equations — $2rx - 2y + 3z = 0$, $x + ry + 2z = 0$, $2x + rz = 0$ has a non-trivial solution, then the real value of $r$ is",
 {"A":"$1$","B":"$-2$","C":"$3$","D":"$2$"},
 ["D"],"medium",["homogeneous-system", "non-trivial-solution", "determinant"],None),

(23,"MATH","M05",1,5,
 "If $\\vec{a}$ and $\\vec{b}$ be two unit vectors and $\\theta$ is the angle between them, then $\\sin\\dfrac{\\theta}{2}$ is",
 {"A":"$\\dfrac{1}{2}\\left|\\vec{a} - \\vec{b}\\right|$","B":"$1$","C":"$\\dfrac{1}{2}\\left|\\vec{a} + \\vec{b}\\right|$","D":"$0$"},
 ["A"],"easy",["dot-product", "unit-vectors", "half-angle"],None),

(24,"MATH","M06",1,6,
 "The value of $\\displaystyle\\lim_{x \\to 0} \\dfrac{\\sin\\left(\\pi\\cos^{2} x\\right)}{x^{2}}$ is",
 {"A":"$-\\pi$","B":"$\\dfrac{\\pi}{2}$","C":"$\\pi$","D":"$0$"},
 ["C"],"medium",["limit", "standard-limit", "trigonometric"],None),

(25,"MATH","M07",1,6,
 "If $y = 2x + \\cot^{-1} x + \\log\\left(\\sqrt{1 + x^{2}} - x\\right)$, then $y$",
 {"A":"decreases on $(-\\infty, \\infty)$","B":"increases on $[0, \\infty)$","C":"decreases on $[0, \\infty)$","D":"increases on $(-\\infty, \\infty)$"},
 ["D"],"medium",["monotonicity", "derivative-sign", "inverse-trigonometric"],None),

(26,"MATH","M07",1,6,
 "A given right circular cone has a volume $p$, and the largest right circular cylinder that can be inscribed in the cone has a volume $q$. Then $p : q$ is",
 {"A":"$9 : 4$","B":"$8 : 3$","C":"$7 : 2$","D":"$5 : 3$"},
 ["A"],"hard",["maxima-minima","cone","cylinder"],None),

(27,"MATH","M04",1,6,
 "The equations of tangents to the hyperbola $\\dfrac{x^{2}}{4} - \\dfrac{y^{2}}{3} = 1$ and which are perpendicular to $x + 2y = 0$ are",
 {"A":"$y = \\dfrac{1}{2}x \\pm \\sqrt{13}$","B":"$y = 2x \\pm \\sqrt{13}$","C":"$y = 2x \\pm \\sqrt{19}$","D":"$y = \\dfrac{1}{2}x \\pm \\sqrt{19}$"},
 ["B"],"hard",["hyperbola","tangent","perpendicular"],None),

(28,"MATH","M09",1,6,
 "If $f(x) = \\lim_{n \\to \\infty}\\left[2x + 4x^{2} + \\cdots + 2nx^{2n-1}\\right]$, $0 < x < 1$, then $\\displaystyle\\int f(x)\\,dx$ is equal to",
 {"A":"$-\\sqrt{1 - x^{2}}$","B":"$\\dfrac{1}{1-x^{2}}$","C":"$\\sqrt{1 - x^{2}}$","D":"$1$"},
 ["C"],"hard",["limit","integration","geometric-series"],None),

(29,"MATH","M10",1,7,
 "If for the differential equation $\\dfrac{dy}{dx} = \\dfrac{x}{y\\log(cx)}$, the general solution is $y^{2} = \\varphi(x)$ ($c$ is a constant), then $\\varphi(x)$ is given by",
 {"A":"$x^{2} + 2cx$","B":"$x^{2} + c$","C":"$2x^{2} + cx$","D":"$x^{2} + cx^{2}$"},
 ["A"],"hard",["ode","variable-separable","general-solution"],None),

(30,"MATH","M11",1,7,
 "Two indistinguishable coins are tossed simultaneously. The probability of getting one head and one tail is",
 {"A":"$\\dfrac{1}{2}$","B":"$\\dfrac{1}{3}$","C":"$\\dfrac{1}{4}$","D":"$1$"},
 ["B"],"easy",["probability","coin-toss","complement"],None),

# ---------------- MATHEMATICS Cat-II (Q31-40) ----------------
(31,"MATH","M01",2,7,
 "If $A$ is a square matrix of order $3$, then",
 {"A":"$|\\operatorname{adj} A| = |A|$ if $|A| \\geq 0$.","B":"$A(\\operatorname{adj} A) = |A|I_{3}$.","C":"$A$ is invertible if $|A| \\neq 0$.","D":"$\\operatorname{adj} A$ is invertible if $|A| \\neq 0$."},
 ["A","B","C","D"],"medium",["adjoint","invertible","matrix-properties"],None),

(32,"MATH","M06",2,7,
 "Let $f(x) = \\begin{cases} \\dfrac{\\sin x}{x}, & x \\neq 0 \\\\ 0, & x = 0 \\end{cases}$. Then",
 {"A":"$f$ and $f'$ both are continuous at $x = 0$.","B":"$f$ is continuous at $x = 0$.","C":"$f$ is derivable at $x = 0$.","D":"$f$ is derivable at $x = 0$ but $f'$ is not continuous at $x = 0$."},
 ["B","C","D"],"hard",["continuity","differentiability","sinx/x"],None),

(33,"MATH","M09",2,8,
 "If $\\displaystyle\\int \\dfrac{dx}{2x^{7} + x^{2} + 1}$, then $I$ is equal to",
 {"A":"$\\dfrac{1}{2}\\ln(2x^{7} + x^{2} + 1) + c$","B":"$\\dfrac{1}{x}\\ln(x^{2} + 1 + 2x^{7}) + c$","C":"$\\dfrac{1}{x^{2}+1+2x^{7}} + c$","D":"$\\dfrac{p(x)}{q(x)} + c_{1}$ (where $p$ and $q$ are polynomial of same degree)"},
 ["A","D"],"hard",["integration","substitution","rational"],None),

(34,"MATH","M10",2,8,
 "Solution of the differential equation $\\dfrac{d^{2}y}{dx^{2}} + \\left(\\dfrac{dy}{dx}\\right)^{2} + 1 = 0$ are given by",
 {"A":"$y = -e^{-x} + c$","B":"$y - e^{-x} = c$","C":"$y + e^{x} = c$","D":"$y - e^{x} = c$"},
 ["A","D"],"hard",["ode","second-order","exponential"],None),

(35,"MATH","M07",2,8,
 "Let $f(x) = \\begin{cases} 3x^{2} + 12x - 1, & -1 \\leq x \\leq 2 \\\\ 37 - x, & 2 < x \\leq 3 \\end{cases}$. Then",
 {"A":"$f(x)$ is increasing on $[-1, 2]$.","B":"$f(x)$ is continuous on $[-1, 3]$.","C":"$f'(2)$ does not exist.","D":"$f(x)$ has the maximum value at $x = 2$."},
 ["A","B","C","D"],"hard",["continuity","differentiability","piecewise"],None),

(36,"MATH","M06",2,8,
 "If $[x]$ is the greatest integer function, then $\\displaystyle\\lim_{x \\to 0} \\dfrac{[x]}{x}$ is",
 {"A":"a non-zero real number.","B":"a rational number.","C":"a strictly positive integer.","D":"zero."},
 ["B","D"],"medium",["limit","greatest-integer","floor"],None),

(37,"MATH","M11",2,9,
 "Let $E$ and $F$ be two independent events. The probability that both $E$ and $F$ happen is $\\dfrac{1}{12}$ and the probability that neither $E$ nor $F$ happens is $\\dfrac{1}{2}$. Then",
 {"A":"$P(E) = \\dfrac{1}{4}, P(F) = \\dfrac{1}{3}$","B":"$P(E) = \\dfrac{1}{6}, P(F) = \\dfrac{1}{4}$","C":"$P(E) = \\dfrac{1}{6}, P(F) = \\dfrac{1}{2}$","D":"$P(E) = \\dfrac{1}{3}, P(F) = \\dfrac{1}{4}$"},
 ["A","D"],"hard",["probability","independent-events","system"],None),

(38,"MATH","M04",2,9,
 "The straight line $y = mx + c$ intersects the circle $x^{2} + y^{2} = r^{2}$ at two distinct points if",
 {"A":"$-r\\sqrt{1+m^{2}} < c < r\\sqrt{1+m^{2}}$","B":"$0 \\leq c < r\\sqrt{1+m^{2}}$","C":"$-r\\sqrt{1-m^{2}} < c < r$","D":"$r < c\\sqrt{1+m^{2}}$"},
 ["A","B"],"medium",["circle","line-intersection","condition"],None),

(39,"MATH","M02",2,9,
 "The system of equations $ax + by + cz = q - r$, $bx + cy + az = r - p$, $cx + ay + bz = p - q$ is",
 {"A":"consistent if $p = q = r$.","B":"inconsistent if $a = b = c$ and $p \\neq q \\neq r$.","C":"consistent if $a, b, c$ are distinct and $a + b + c = 0$.","D":"inconsistent for any value of $a, b, c$."},
 ["A","C"],"hard",["linear-system","consistency","cyclic"],None),

(40,"MATH","M09",2,9,
 "The value of $\\displaystyle\\int \\dfrac{\\tan x}{x}\\,dx$ is",
 {"A":"$\\dfrac{1}{2}\\ln\\sec^{2}x + c$","B":"$\\ln\\sec x + c$","C":"$\\dfrac{\\pi}{2}\\ln a$","D":"$2\\ln\\sec x + c$"},
 ["B"],"medium",["integration","tangent","logarithm"],None),

# ---------------- PHYSICS Cat-I (Q41-65) ----------------
(41,"PHYS","P01",1,10,
 "The equation of state of some gases can be expressed as $\\left(P + \\dfrac{a}{V^{2}}\\right)(V - b) = RT$ where $P$ is pressure, $V$ is volume, $T$ is absolute temperature and $a, b, R$ are constants. The dimension of $'a'$ is",
 {"A":"$[ML^{2}T^{-2}]$","B":"$[ML^{-1}T^{-2}]$","C":"$[L^{2}]$","D":"$[L]$"},
 ["W"],"voided",["dimensions","dimensional-analysis","equation-of-state","voided"],None),

(42,"PHYS","P01",1,10,
 "The resistance $R = \\dfrac{V}{I}$, where $V = 100 \\pm 5$ volts and $I = 10 \\pm 0.2$ amperes. The total percentage of error in $R$ is",
 {"A":"$5\\%$","B":"$7\\%$","C":"$5.2\\%$","D":"$9\\%$"},
 ["B"],"medium",["error-analysis","resistance","percentage"],None),

(43,"PHYS","P05",1,10,
 "If three vectors satisfy the relation $\\vec{A} \\cdot \\vec{B} = 0$ and $\\vec{A} \\cdot \\vec{C} = 0$, then $\\vec{A}$ can be parallel to",
 {"A":"$\\vec{C}$","B":"$\\vec{B}$","C":"$\\vec{B} \\times \\vec{C}$","D":"$\\vec{B} \\cdot \\vec{C}$"},
 ["C"],"medium",["vectors","dot-product","cross-product"],None),

(44,"PHYS","P02",1,10,
 "The acceleration of a particle varies with time as shown in the figure. The corresponding velocity-time graph will be [Assume at $t = 0$, velocity $v = 0$]",
 {"A":"$v$ increases linearly then constant","B":"$v$ increases then decreases","C":"$v$ constant then increases","D":"$v$ decreases linearly"},
 ["C"],"medium",["kinematics","acceleration-graph","velocity-time"],"fig-2025-q44"),

(45,"PHYS","P05",1,11,
 "A particle is shifted from a point $(0, 0, 1\\,\\text{m})$ to a point $(1\\,\\text{m}, 1\\,\\text{m}, 2\\,\\text{m})$ under the simultaneous action of forces. These forces are $\\vec{F}_{1} = (2\\hat{i} + 3\\hat{j} - \\hat{k})\\,\\text{N}$ and $\\vec{F}_{2} = (\\hat{i} - 2\\hat{j} + 2\\hat{k})\\,\\text{N}$. Find the work done by the resultant of these two forces.",
 {"A":"$4\\,\\text{J}$","B":"$1\\,\\text{J}$","C":"$5\\,\\text{J}$","D":"$3\\,\\text{J}$"},
 ["C"],"medium",["work","dot-product","vectors"],None),

(46,"PHYS","P02",1,11,
 "Figure shows the displacement of a particle moving along $x$ axis as a function of time. The acceleration of the particle is zero in the region",
 {"A":"$AB$ and $BC$","B":"$AB$ and $CD$","C":"$BC$ and $CD$","D":"$CD$ and $DE$"},
 ["B"],"medium",["kinematics","displacement-time","acceleration"],"fig-2025-q46"),

(47,"PHYS","P02",1,11,
 "A stone is dropped from a certain height which can reach the ground in $5\\,\\text{sec}$. It is stopped after $3\\,\\text{sec}$ of its fall and is again released. The total time taken by the stone to reach the ground will be",
 {"A":"$6.0\\,\\text{sec}$","B":"$6.5\\,\\text{sec}$","C":"$7.0\\,\\text{sec}$","D":"$7.5\\,\\text{sec}$"},
 ["C"],"medium",["kinematics","free-fall","time"],None),

(48,"PHYS","P08",1,11,
 "A stone of relative density $\\rho$ is released from rest on the surface of a lake. If the viscous effects are ignored, the stone sinks in water with an acceleration of",
 {"A":"$g(1 - \\rho)$","B":"$g(1 + \\rho)$","C":"$g(\\rho - 1)$","D":"$g\\rho$"},
 ["C"],"medium",["fluid","buoyancy","acceleration"],None),

(49,"PHYS","P05",1,11,
 "An artificial satellite moving in circular orbit around the earth has a total energy (kinetic + potential energy) $E_{0}$. Its potential energy is",
 {"A":"$-E_{0}$","B":"$\\dfrac{1}{2}E_{0}$","C":"$-2E_{0}$","D":"$E_{0}$"},
 ["C"],"medium",["gravitation","satellite","energy"],None),

(50,"PHYS","P03",1,12,
 "A bomb initially at rest explodes by itself into three equal mass fragments. The velocities of two fragments are $(\\hat{i} + 3\\hat{j})\\,\\text{m/s}$ and $(2\\hat{i} - 4\\hat{j})\\,\\text{m/s}$. The velocity of the third fragment (in $\\text{m/s}$) is",
 {"A":"$(-3\\hat{i} + \\hat{j})\\,\\text{m/s}$","B":"$(3\\hat{i} - \\hat{j})\\,\\text{m/s}$","C":"$(\\hat{i} - 3\\hat{j})\\,\\text{m/s}$","D":"$(\\hat{i} + 3\\hat{j})\\,\\text{m/s}$"},
 ["A"],"medium",["momentum","conservation","explosion"],None),

(51,"PHYS","P08",1,12,
 "Which of the graphs shown in figures represents the velocity-time ($v$-$t$) graph of a small spherical body falling in a viscous fluid? (Body just dropped on the surface of the viscous fluid)",
 {"A":"$v$ increases then becomes constant","B":"$v$ constant from start","C":"$v$ decreases then constant","D":"$v$ increases linearly forever"},
 ["A"],"medium",["fluid","viscous","velocity-time-graph"],"fig-2025-q51"),

(52,"PHYS","P03",1,12,
 "A bullet hits horizontally and gets embedded in a solid block resting on a frictionless surface. In this process",
 {"A":"momentum is conserved.","B":"kinetic energy is conserved.","C":"both momentum and kinetic energy are conserved.","D":"neither momentum nor kinetic energy is conserved."},
 ["A"],"easy",["momentum","inelastic-collision","conservation"],None),

(53,"PHYS","P03",1,12,
 "A rod of length $L$ has its linear density increasing linearly from zero at one end to $\\lambda_{0}$ at the other end. If $L$ is the length of rod and $x$ is the position of an elementary mass from one end of the rod, then the position of its centre of mass from $x = 0$ end is",
 {"A":"$\\dfrac{2L}{3}$","B":"$\\dfrac{L}{3}$","C":"$\\dfrac{3L}{4}$","D":"$\\dfrac{L}{4}$"},
 ["D"],"hard",["centre-of-mass","linear-density","rod"],None),

(54,"PHYS","P04",1,13,
 "A disc of mass $M$ and radius $R$ rolls on a horizontal surface and then rolls up an inclined plane as shown in the figure. If the velocity of the disc is $V$, the height to which the disc will rise will be",
 {"A":"$\\dfrac{3V^{2}}{2g}$","B":"$\\dfrac{3V^{2}}{4g}$","C":"$\\dfrac{V^{2}}{4g}$","D":"$\\dfrac{V^{2}}{2g}$"},
 ["B"],"hard",["rolling","energy","inclined-plane"],"fig-2025-q54"),

(55,"PHYS","P06",1,13,
 "The dimensions of two wires $A$ and $B$ are the same, but their materials are different. Their extension-load graphs are shown in figure. If $Y_{A}$ and $Y_{B}$ are the values of Young's modulus of elasticity of $A$ and $B$ respectively, then",
 {"A":"$Y_{A} > Y_{B}$","B":"$Y_{A} < Y_{B}$","C":"$Y_{A} = Y_{B}$","D":"$Y_{B} = 2Y_{A}$"},
 ["A"],"medium",["elasticity","young-modulus","graph"],"fig-2025-q55"),

(56,"PHYS","P08",1,13,
 "Two non-mixing liquids of densities $\\rho$ and $n\\rho$ ($n > 1$) are put in a container. The height of each liquid is $h$. A solid cylinder of length $L$ and density $d$ is put in this container. The cylinder floats with its axis vertical and length $\\rho L$ ($\\rho < 1$) in the denser liquid and the rest part within other liquid. The density $'d'$ is equal to",
 {"A":"$\\{1 + (n + 1)\\rho\\}\\rho$","B":"$\\{2 + (n + 1)\\rho\\}\\rho$","C":"$\\{2 + (n - 1)\\rho\\}\\rho$","D":"$\\{1 + (n - 1)\\rho\\}\\rho$"},
 ["D"],"hard",["fluid","floatation","density"],None),

(57,"PHYS","P11",1,14,
 "When a system is taken from state $a$ to state $b$ along the path $acb$, it is found that a quantity of heat $Q = 200\\,\\text{J}$ is absorbed by the system and a work $W = 80\\,\\text{J}$ is done by it. Along the path $adb$, $Q = 144\\,\\text{J}$. The work done along the path $adb$ is",
 {"A":"$6\\,\\text{J}$","B":"$12\\,\\text{J}$","C":"$18\\,\\text{J}$","D":"$24\\,\\text{J}$"},
 ["D"],"medium",["thermodynamics","first-law","work-heat"],None),

(58,"PHYS","P11",1,14,
 "One mole of an ideal gas goes from an initial state $A$ to final state $B$ via two processes. It firstly undergoes isothermal expansion from volume $V$ to $3V$ and then its volume is reduced from $3V$ to $V$ at constant pressure. The correct $P$-$V$ diagram representing the two processes is",
 {"A":"isothermal expansion then isobaric compression","B":"isobaric expansion then isothermal compression","C":"isothermal then isochoric","D":"isobaric then isochoric"},
 ["B"],"medium",["thermodynamics","pv-diagram","processes"],"fig-2025-q58"),

(59,"PHYS","P03",1,14,
 "A particle is executing SHM along a straight line. Its velocities at distances $x_{1}$ and $x_{2}$ from the mean position are $v_{1}$ and $v_{2}$, respectively. Its time period is",
 {"A":"$2\\pi\\sqrt{\\dfrac{x_{1}^{2} - x_{2}^{2}}{v_{2}^{2} - v_{1}^{2}}}$","B":"$2\\pi\\sqrt{\\dfrac{x_{1}^{2} + x_{2}^{2}}{v_{1}^{2} + v_{2}^{2}}}$","C":"$2\\pi\\sqrt{\\dfrac{x_{1}^{2} - x_{2}^{2}}{v_{1}^{2} - v_{2}^{2}}}$","D":"$2\\pi\\sqrt{\\dfrac{x_{1} + x_{2}}{v_{1} + v_{2}}}$"},
 ["A"],"hard",["shm","velocity","time-period"],None),

(60,"PHYS","P14",1,15,
 "A plano convex lens fits exactly into a plano concave lens. Their plane surfaces are parallel to each other. If lenses are made of different materials of refractive indices $\\mu_{1}$ and $\\mu_{2}$ and $R$ is the radius of curvature of the curved surface of the lenses, the focal length of combination is",
 {"A":"$\\dfrac{2R}{\\mu_{1} + \\mu_{2}}$","B":"$\\dfrac{R}{\\mu_{2} - \\mu_{1}}$","C":"$\\dfrac{R}{2(\\mu_{1} - \\mu_{2})}$","D":"$\\dfrac{R}{\\mu_{1} - \\mu_{2}}$"},
 ["D"],"hard",["lens","combination","focal-length"],None),

(61,"PHYS","P11",1,15,
 "The temperature of equal masses of three different liquids $A$, $B$ and $C$ are $10^{\\circ}\\text{C}$, $15^{\\circ}\\text{C}$ and $20^{\\circ}\\text{C}$ respectively. The temperature when $A$ and $B$ are mixed is $13^{\\circ}\\text{C}$ and when $B$ and $C$ are mixed, it is $16^{\\circ}\\text{C}$. What will be the temperature when $A$ and $C$ are mixed ?",
 {"A":"$13^{\\circ}\\text{C}$","B":"$\\dfrac{110}{7}\\,^{\\circ}\\text{C}$","C":"$30^{\\circ}\\text{C}$","D":"$15^{\\circ}\\text{C}$"},
 ["A"],"hard",["calorimetry","mixing","temperature"],"fig-2025-q61"),

(62,"PHYS","P11",1,15,
 "A substance is heated with heat input as shown in figure. What does the slope of $DE$ represent ?",
 {"A":"Latent heat of liquid","B":"Latent heat of vapour","C":"Heat capacity of vapour","D":"Inverse of heat capacity of vapour"},
 ["D"],"medium",["thermodynamics","heat-graph","slope"],"fig-2025-q62"),

(63,"PHYS","P10",1,16,
 "The length and radii of two rods made of same material are in the ratio $1 : 2$ and $2 : 3$ respectively. The temperature difference between the ends for the two rods be the same in the steady state. The amount of heat flowing per second through them will be in the ratio of",
 {"A":"$1 : 3$","B":"$4 : 3$","C":"$8 : 9$","D":"$3 : 2$"},
 ["C"],"hard",["thermal-conduction","rods","ratio"],None),

(64,"PHYS","P15",1,16,
 "Surfaces of two metal block $A$ and $B$ of same dimension made of same metal are illuminated with light of wavelength $\\lambda_{1} = 350\\,\\text{nm}$ and $\\lambda_{2} = 540\\,\\text{nm}$ respectively. If $v_{1}$ and $v_{2}$ represent the maximum speed of the photo-electrons emitted from block $A$ and $B$ respectively, then",
 {"A":"$v_{1} = v_{2}$","B":"$v_{1} > v_{2}$","C":"$v_{1} < v_{2}$","D":"the relation between $v_{1}$ and $v_{2}$ can not be predicted from the supplied data."},
 ["B"],"medium",["photoelectric","wavelength","max-speed"],None),

(65,"PHYS","P08",1,16,
 "A spherical ball of radius $1 \\times 10^{-4}\\,\\text{m}$ and density $10^{3}\\,\\text{kg/m}^{3}$ falls freely under gravity through a distance $h$ before entering a tank of water. If the velocity of the ball does not change after entering the water, find $h$. (Viscosity of water is $9.8 \\times 10^{-6}\\,\\text{N-s/m}^{2}$)",
 {"A":"$20.41\\,\\text{m}$","B":"$2.041\\,\\text{m}$","C":"$0.2041\\,\\text{m}$","D":"$204.1\\,\\text{m}$"},
 ["A"],"hard",["fluid","viscosity","stokes-law"],None),

# ---------------- PHYSICS Cat-II (Q66-70) ----------------
(66,"PHYS","P02",2,17,
 "A car starts from rest and accelerates uniformly for $4\\,\\text{sec}$ and then moves with uniform velocity. Which of the following displacement ($x$) - time ($t$) graph represents the motion of the car ?",
 {"A":"parabolic then linear","B":"linear then parabolic","C":"linear throughout","D":"parabolic throughout"},
 ["D"],"medium",["kinematics","displacement-time","graph"],"fig-2025-q66"),

(67,"PHYS","P03",2,17,
 "A block of mass $2\\,\\text{kg}$ is hanging over a smooth and light pulley through a light string. The other end of the string is pulled by a constant force $F = 40\\,\\text{N}$. At $t = 0$ the system is at rest as shown. Then in the time interval from $t = 0$ to $t = \\dfrac{2}{\\sqrt{10}}\\,\\text{sec}$, pick up the correct statement(s). ($g = 10\\,\\text{m/s}^{2}$)",
 {"A":"Tension in the string is $20\\,\\text{N}$.","B":"Work done by gravity is $-20\\,\\text{J}$.","C":"Work done by tension on block is $80\\,\\text{J}$.","D":"Displacement of the block is $2\\,\\text{m}$."},
 ["C","D"],"hard",["work-energy","pulley","force"],"fig-2025-q67"),

(68,"PHYS","P05",2,18,
 "A planet revolving around the Sun in an elliptical orbit has a constant",
 {"A":"Kinetic energy.","B":"angular momentum about the Sun.","C":"Potential energy.","D":"total energy."},
 ["B","D"],"medium",["gravitation","planet","conservation"],None),

(69,"PHYS","P11",2,18,
 "$5\\,\\text{kg}$ of steam at $100^{\\circ}\\text{C}$ is mixed with $10\\,\\text{kg}$ of ice at $0^{\\circ}\\text{C}$. Choose the correct alternative(s). (Given $S_{\\text{water}} = 1\\,\\text{Cal/g}^{\\circ}\\text{C}$, $L_{f} = 80\\,\\text{Cal/g}$, $L_{v} = 540\\,\\text{Cal/g}$.)",
 {"A":"Equilibrium temperature of the mixture is $160^{\\circ}\\text{C}$.","B":"Equilibrium temperature of the mixture is $100^{\\circ}\\text{C}$.","C":"At equilibrium mixture contains $13\\,\\text{kg}$ of water.","D":"At equilibrium, mixture contains $1\\,\\text{kg}$ of steam."},
 ["B","C","D"],"hard",["calorimetry","steam-ice","latent-heat"],None),

(70,"PHYS","P05",2,18,
 "For a vector, $\\vec{P} = (\\vec{A} \\times \\vec{B}) \\times (\\vec{C} \\times \\vec{D})$, choose the correct alternative(s).",
 {"A":"Vector $\\vec{P}$ is perpendicular to the plane containing $\\vec{A}$ and $\\vec{B}$.","B":"$\\vec{P}$ resides in a plane containing $\\vec{A}$ and $\\vec{B}$.","C":"$\\vec{P}$ resides in a plane containing $\\vec{C}$ and $\\vec{D}$.","D":"$\\vec{P}$ is parallel to the line of intersection of two planes containing $\\vec{A}, \\vec{B}$ and $\\vec{C}, \\vec{D}$ respectively."},
 ["B","C","D"],"hard",["vectors","cross-product","triple-product"],None),

# ---------------- CHEMISTRY Cat-I (Q71-85) ----------------
(71,"CHEM","C01",1,19,
 "An orbital having $n = 5$ and $l = 3$ is designated as",
 {"A":"$5s$","B":"$5p$","C":"$5d$","D":"$5f$"},
 ["D"],"easy",["atomic-structure","quantum-numbers","orbital"],None),

(72,"CHEM","C02",1,19,
 "How many types of $P$-$Cl$ bonds are present in $PCl_{5}$ molecule ?",
 {"A":"One","B":"Two","C":"Three","D":"Five"},
 ["B"],"medium",["chemical-bonding","pc l5","bond-types"],None),

(73,"CHEM","C01",1,19,
 "Silicon doped with electron-rich impurity forms",
 {"A":"Insulator","B":"$p$-type semiconductor","C":"$n$-type semiconductor","D":"amorphous powder"},
 ["C"],"easy",["semiconductor","doping","n-type"],None),

(74,"CHEM","C04",1,19,
 "NO reacts with $N_{2}O_{4}$ in a basic solution to form $NO_{2}$. The reaction is classified as",
 {"A":"Decomposition","B":"Disproportionation","C":"Comproportionation","D":"Acid-Base"},
 ["C"],"medium",["redox","comproportionation","no-no2"],None),

(75,"CHEM","C03",1,19,
 "Suppose solution $X$ has a pH of $6.0$ and solution $Y$ has a pH of $7.0$. Which of the following statements about two solutions is correct ?",
 {"A":"Both $X$ and $Y$ are acidic.","B":"Solution $X$ is $10$ times more acidic than solution $Y$.","C":"$[\\text{OH}^{-}] > [\\text{H}^{+}]$ in solution $Y$.","D":"None of the above"},
 ["B"],"medium",["ph","acidity","solutions"],None),

(76,"CHEM","C04",1,20,
 "The standard EMF for the cell reaction $Zn + Cu^{2+} \\to Cu + Zn^{2+}$ is $1.10\\,\\text{V}$ at $25^{\\circ}\\text{C}$. The EMF for the cell reaction, when $0.1\\,\\text{M}\\,Cu^{2+}$ and $0.1\\,\\text{M}\\,Zn^{2+}$ solutions are used, at $25^{\\circ}\\text{C}$ is",
 {"A":"$1.10\\,\\text{V}$","B":"$0.110\\,\\text{V}$","C":"$-1.10\\,\\text{V}$","D":"$-0.110\\,\\text{V}$"},
 ["A"],"medium",["electrochemistry","emf","nernst"],None),

(77,"CHEM","C05",1,20,
 "In which of the following equilibria would a decrease in volume promote the formation of more products ?",
 {"A":"$\\text{N}_{2}(g) + \\text{O}_{2}(g) \\rightleftharpoons 2\\text{NO}(g)$","B":"$\\text{N}_{2}\\text{O}_{4}(g) \\rightleftharpoons 2\\text{NO}_{2}(g)$","C":"$\\text{H}_{2}\\text{O}(l) + \\text{CO}_{2}(g) \\rightleftharpoons \\text{H}_{2}\\text{CO}_{3}(aq)$","D":"$\\text{CaCO}_{3}(s) \\rightleftharpoons \\text{CaO}(s) + \\text{CO}_{2}(g)$"},
 ["C"],"medium",["equilibrium","le-chatelier","volume"],None),

(78,"CHEM","C03",1,20,
 "Which of the following salts will give highest pH in water ?",
 {"A":"$\\text{KCl}$","B":"$\\text{NaCl}$","C":"$\\text{Na}_{2}\\text{CO}_{3}$","D":"$\\text{CuSO}_{4}$"},
 ["C"],"easy",["salts","ph","hydrolysis"],None),

(79,"CHEM","C04",1,20,
 "Which of the following metals can be obtained by the electrolysis of an aqueous solution of their salts ?",
 {"A":"$\\text{Na}$","B":"$\\text{Mg}$","C":"$\\text{Ca}$","D":"$\\text{Al}$"},
 ["W"],"voided",["electrolysis","metals","aqueous"],None),

(80,"CHEM","C04",1,20,
 "In the following conversion, how many electrons are involved? $\\text{N}_{2} \\to \\text{NH}_{3}$",
 {"A":"$2$","B":"$3$","C":"$4$","D":"$6$"},
 ["D"],"medium",["redox","electrons","n2-nh3"],None),

(81,"CHEM","C08",1,20,
 "IUPAC name of the following compound is",
 {"A":"3-(2-Methylpropyl) hept-1-en-4-yne","B":"2-Methyl-4-ethenyl-oct-5-yne","C":"7-Methyl-5-ethenyl-oct-3-yne","D":"None of the above"},
 ["A"],"hard",["organic","iupac","nomenclature"],"fig-2025-q81"),

(82,"CHEM","C08",1,20,
 "Which structural isomerism is exhibited by the following pairs ?",
 {"A":"Positional Isomerism","B":"Chain Isomerism","C":"Functional Isomerism","D":"Geometrical Isomerism"},
 ["C"],"medium",["organic","isomerism","structural"],"fig-2025-q82"),

(83,"CHEM","C08",1,21,
 "The major product in the following reaction is $\\text{CH}_{3}\\text{Cl} \\xrightarrow[(i)\\,\\text{Mg/Ether}]{\\ (ii)\\,\\text{CH}_{3}\\text{COOH}}$",
 {"A":"$\\text{CH}_{4}$","B":"$\\text{C}_{2}\\text{H}_{6}$","C":"$\\text{CH}_{3}\\text{COOCH}_{3}$","D":"None of these"},
 ["A"],"medium",["organic","grignard","ester"],"fig-2025-q83"),

(84,"CHEM","C01",1,21,
 "The hybridization state of a carbanion is",
 {"A":"$sp$","B":"$sp^{2}$","C":"$sp^{3}$","D":"$sp^{4}$"},
 ["W"],"voided",["hybridization","carbanion"],None),

(85,"CHEM","C08",1,21,
 "The major product in the following reaction is $\\text{HC} \\equiv \\text{CH} \\xrightarrow[\\text{(ii) Ethylbromide (excess)}]{\\ (i)\\,\\text{NaNH}_{2}/\\text{liq. NH}_{3}}$",
 {"A":"$\\text{CH}_{3}\\text{CH}_{2}-\\text{C}\\equiv\\text{C}-\\text{CH}_{2}\\text{CH}_{3}$","B":"$\\text{CH}_{3}\\text{CH}_{2}-\\text{C}\\equiv\\text{C}-\\text{CH}_{2}\\text{CH}_{3}$","C":"$\\text{CH}_{3}\\text{CH}_{2}-\\text{Br}$","D":"$\\text{NH}_{2}$"},
 ["B"],"medium",["organic","acetylene","alkylation"],"fig-2025-q85"),

# ---------------- CHEMISTRY Cat-II (Q86-90) ----------------
(86,"CHEM","C01",2,22,
 "In Rutherford's gold leaf experiment, the scattering of $\\alpha$-particles takes place. In this process (I) coulombic force is involved (II) nuclear force is involved (III) path of $\\alpha$-particle is parabolic (IV) path of $\\alpha$-particle is hyperbolic",
 {"A":"I","B":"II","C":"III","D":"IV"},
 ["A","D"],"medium",["atomic-structure","rutherford","scattering"],None),

(87,"CHEM","C03",2,22,
 "By adding water to the solution of ionic compound, its (I) concentration remains same. (II) concentration increases. (III) ionization may increase. (IV) concentration decreases.",
 {"A":"I","B":"II","C":"III","D":"IV"},
 ["C","D"],"medium",["solutions","ionization","concentration"],None),

(88,"CHEM","C08",2,22,
 "The product(s) in the following reaction is/are $\\text{CH}_{3}\\text{CH}=\\text{CH}_{2} + \\text{HBr} \\to$",
 {"A":"(I) $\\text{CH}_{3}\\text{CHBrCH}_{3}$","B":"(II) $\\text{CH}_{3}\\text{CH}_{2}\\text{CH}_{2}\\text{Br}$","C":"I and II","D":"III and IV"},
 ["A","B","C"],"hard",["organic","hbr","markovnikov"],"fig-2025-q88"),

(89,"CHEM","C05",2,23,
 "For which of the following reactions, $k_{f}$ is less than $k_{e}$ ? (I) $\\text{N}_{2}\\text{O}_{4} \\rightleftharpoons 2\\text{NO}_{2}$ (II) $\\text{N}_{2} + 3\\text{H}_{2} \\rightleftharpoons 2\\text{NH}_{3}$ (III) $\\text{H}_{2} + \\text{I}_{2} \\rightleftharpoons 2\\text{HI}$ (IV) $\\text{CO} + \\text{H}_{2}\\text{O} \\rightleftharpoons \\text{CO}_{2} + \\text{H}_{2}$",
 {"A":"I","B":"II","C":"III","D":"IV"},
 ["B"],"medium",["equilibrium","rate-constant","forward-reverse"],None),

(90,"CHEM","C03",2,23,
 "Which of the following statement about $HNO_{3}$ is/are correct ?",
 {"A":"It is a solid.","B":"It is an oxoacid of nitrogen.","C":"It is a reducing agent.","D":"It is an oxidizing agent."},
 ["B","D"],"medium",["acids-bases","hno3","oxoacid"],None),

# ---------------- FEEE Cat-I (Q91-100) ----------------
(91,"FEEE","E01",1,24,
 "A PMMC ammeter measures current $i(t) = (5 + 5\\sin 100\\pi t)\\,\\text{A}$. The reading of the meter will be",
 {"A":"$5\\,\\text{A}$","B":"$10\\,\\text{A}$","C":"$0\\,\\text{A}$","D":"None of these"},
 ["A"],"medium",["pmmc","ammeter","rms-average"],None),

(92,"FEEE","E02",1,24,
 "An ideal single phase transformer with $200\\,\\text{V}$, $50\\,\\text{Hz}$ supply at its primary side is delivering to $100\\,\\text{watt}$ resistive load at $10\\,\\text{V}$ connected to its secondary side. The current drawn by the transformer from the supply is",
 {"A":"$0\\,\\text{A}$","B":"$0.5\\,\\text{A}$","C":"$1.0\\,\\text{A}$","D":"$10\\,\\text{A}$"},
 ["B"],"medium",["transformer","ideal","current"],None),

(93,"FEEE","E03",1,24,
 "Which of the following electrical machines has the highest efficiency ?",
 {"A":"DC shunt motor","B":"DC series motor","C":"Single phase induction motor","D":"Transformer"},
 ["D"],"easy",["electrical-machines","efficiency","transformer"],None),

(94,"FEEE","E02",1,24,
 "A power supply has a full load voltage of $10\\,\\text{V}$. Its no load voltage for $0\\%$ regulation is",
 {"A":"$10\\,\\text{V}$","B":"$0\\,\\text{V}$","C":"less than $10\\,\\text{V}$","D":"greater than $10\\,\\text{V}$"},
 ["A"],"easy",["regulation","voltage","power-supply"],None),

(95,"FEEE","E05",1,24,
 "The following circuit carries alternating currents $I_{1}$, $I_{2}$ and $I$. Under which condition $I_{1}$, $I_{2}$ and $I$ will be in the same phase? (The frequency of the alternating current is $50\\,\\text{Hz}$)",
 {"A":"$R_{1}R_{2} = L_{1}L_{2}$","B":"$\\dfrac{R_{1}}{R_{2}} = \\dfrac{L_{1}}{L_{2}}$","C":"$R_{1}L_{1} = R_{2}L_{2}$","D":"None of these"},
 ["B"],"hard",["ac-circuit","phase","rl-circuit"],"fig-2025-q95"),

(96,"FEEE","E06",1,25,
 "In a PNP transistor, the emitter current ($I_{e}$) is $10\\,\\text{mA}$ and the base current ($I_{b}$) is $0.1\\,\\text{mA}$. Its collector current ($I_{c}$) would be",
 {"A":"$9.9\\,\\text{mA}$","B":"$10.1\\,\\text{mA}$","C":"$100\\,\\text{mA}$","D":"$0.9\\,\\text{mA}$"},
 ["A"],"easy",["transistor","pnp","currents"],None),

(97,"FEEE","E06",1,25,
 "Which statement is valid for CMOS technology ?",
 {"A":"Employs only N-type MOSFETs","B":"Employs only P-type MOSFETs","C":"Consumes high static power","D":"Employs both N-type and P-type MOSFETs"},
 ["D"],"easy",["cmos","mosfet","technology"],None),

(98,"FEEE","E07",1,25,
 "Which of the OPAMP based configurations provides no phase difference between input and output ?",
 {"A":"Inverting amplifier","B":"Non-inverting amplifier","C":"Integrator","D":"Differentiator"},
 ["B"],"easy",["opamp","phase","configuration"],None),

(99,"FEEE","E08",1,25,
 "Simplify the Boolean Expression: $(A + B)\\cdot(A + B') + A'$",
 {"A":"$A + B$","B":"$1$","C":"$B$","D":"$A'$"},
 ["B"],"medium",["boolean","simplification","algebra"],None),

(100,"FEEE","E08",1,25,
 "The combination of Logic Gates in the following circuit is equivalent to",
 {"A":"XOR Gate","B":"AND Gate","C":"XNOR Gate","D":"NAND Gate"},
 ["B"],"medium",["digital","logic-gate","combination"],"fig-2025-q100"),
]
