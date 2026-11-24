# JELET 2025 Paper-I Set A — question data, validated against WBJEEB Final Answer Key JEEB/Reg-171/25.
# Q1–Q100: verbatim visual transcription from 180-DPI renders of the official Set A booklet (PDF pages 2–25).
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
 ["A"],"hard",["maxima-minima", "cone", "inscribed-cylinder"],None),

(27,"MATH","M04",1,6,
 "The equations of tangents to the hyperbola $\\dfrac{x^{2}}{4} - \\dfrac{y^{2}}{3} = 1$ and which are perpendicular to $x + 2y = 0$ are",
 {"A":"$y = 13 \\pm 2x$","B":"$y = 2x \\pm \\sqrt{13}$","C":"$y = 2x \\pm \\sqrt{19}$","D":"$y = 7 \\pm 2x$"},
 ["B"],"medium",["hyperbola", "tangent-condition", "perpendicular-lines"],None),

(28,"MATH","M09",1,6,
 "If $f(x) = \\displaystyle\\lim_{n \\to \\infty}\\left[2x + 4x^{3} + \\ldots + 2nx^{2n-1}\\right]$, $0 < x < 1$, then $\\displaystyle\\int f(x)\\,dx$ is equal to",
 {"A":"$-\\sqrt{1 - x^{2}}$","B":"$\\dfrac{1}{\\sqrt{1 - x^{2}}}$","C":"$\\dfrac{1}{1 - x^{2}}$","D":"$1$"},
 ["C"],"hard",["series-limit", "arithmetico-geometric-series", "integration"],None),

(29,"MATH","M10",1,7,
 "If for the differential equation $\\dfrac{dy}{dx} = \\dfrac{y}{x} + \\phi\\!\\left(x/y\\right)$, the general solution is $y = \\dfrac{x}{\\log(cx)}$ ($c$ is a constant), then $\\phi\\!\\left(x/y\\right)$ is given by",
 {"A":"$-\\dfrac{y^{2}}{x^{2}}$","B":"$\\dfrac{y^{2}}{x^{2}}$","C":"$-\\dfrac{x^{2}}{y^{2}}$","D":"$\\dfrac{x^{2}}{y^{2}}$"},
 ["A"],"medium",["ode", "homogeneous-equation", "general-solution"],None),

(30,"MATH","M11",1,7,
 "Two indistinguishable coins are tossed simultaneously. The probability of getting one head and one tail is",
 {"A":"$\\dfrac{1}{2}$","B":"$\\dfrac{1}{3}$","C":"$\\dfrac{1}{4}$","D":"$1$"},
 ["B"],"medium",["probability", "indistinguishable-objects", "sample-space"],None),

# ---------------- MATHEMATICS Cat-II (Q31-40) ----------------
(31,"MATH","M01",2,7,
 "If $A$ is a square matrix of order $3$, then",
 {"A":"$|\\operatorname{adj} A| = |A|^{2}$ if $|A| \\neq 0$.","B":"$A(\\operatorname{adj} A) = |A|I_{3}$.","C":"$A$ is invertible if $|A| \\neq 0$.","D":"$\\operatorname{adj} A$ is invertible if $|A| \\neq 0$."},
 ["A", "B", "C", "D"],"medium",["adjoint", "invertible-matrix", "determinant"],None),

(32,"MATH","M06",2,7,
 "Let $f(x) = \\begin{cases} x^{2}\\sin\\dfrac{1}{x}, & x \\neq 0 \\\\ 0, & x = 0 \\end{cases}$. Then",
 {"A":"$f$ and $f'$ both are continuous at $x = 0$.","B":"$f$ is continuous at $x = 0$.","C":"$f$ is derivable at $x = 0$.","D":"$f$ is derivable at $x = 0$ but $f'$ is not continuous at $x = 0$."},
 ["B", "C", "D"],"hard",["continuity", "differentiability", "x^2-sin(1/x)"],None),

(33,"MATH","M09",2,8,
 "If $I = \\displaystyle\\int \\dfrac{\\left(5x^{8} + 7x^{6}\\right)}{\\left(x^{2} + 1 + 2x^{7}\\right)^{2}}\\,dx$, then $I$ is equal to",
 {"A":"$\\dfrac{x^{7}}{2x^{7} + x^{2} + 1} + c_{1}$","B":"$\\dfrac{x^{5}}{x^{2} + 1 + 2x^{7}} + c_{1}$","C":"$\\dfrac{1}{x^{2} + 1 + 2x^{7}} + c_{1}$","D":"$\\dfrac{p(x)}{q(x)} + c_{1}$ (where $p$ and $q$ are polynomial of same degree) ($c_{1}$ is an integration constant.)"},
 ["A", "D"],"hard",["integration", "quotient-rule-reverse", "rational-function"],None),

(34,"MATH","M10",2,8,
 "Solution of the differential equation $\\left(\\dfrac{dy}{dx}\\right)^{2} - \\left(e^{x} + e^{-x}\\right)\\dfrac{dy}{dx} + 1 = 0$ are given by",
 {"A":"$y = -e^{-x} + c$","B":"$y - e^{-x} = c$","C":"$y + e^{x} = c$","D":"$y - e^{x} = c$ ($c$ = constant of integration.)"},
 ["A", "D"],"medium",["ode", "first-order-higher-degree", "factorisation"],None),

(35,"MATH","M07",2,8,
 "Let $f(x) = \\begin{cases} 3x^{2} + 12x - 1, & -1 \\leq x \\leq 2 \\\\ 37 - x, & 2 < x \\leq 3 \\end{cases}$. Then",
 {"A":"$f(x)$ is increasing on $[-1, 2]$.","B":"$f(x)$ is continuous on $[-1, 3]$.","C":"$f'(2)$ does not exist.","D":"$f(x)$ has the maximum value at $x = 2$."},
 ["A", "B", "C", "D"],"medium",["piecewise-function", "monotonicity", "maxima"],None),

(36,"MATH","M06",2,8,
 "If $[x]$ is the greatest integer function, then $\\displaystyle\\lim_{x \\to 0} x^{8}\\left[\\dfrac{1}{x^{3}}\\right]$ is",
 {"A":"a non-zero real number.","B":"a rational number.","C":"a strictly positive integer.","D":"zero."},
 ["B", "D"],"medium",["limit", "greatest-integer", "squeeze-theorem"],None),

(37,"MATH","M11",2,9,
 "Let $E$ and $F$ be two independent events. The probability that both $E$ and $F$ happen is $\\dfrac{1}{12}$ and the probability that neither $E$ nor $F$ happens is $\\dfrac{1}{2}$. Then",
 {"A":"$P(E) = \\dfrac{1}{3},\\ P(F) = \\dfrac{1}{4}$","B":"$P(E) = \\dfrac{1}{2},\\ P(F) = \\dfrac{1}{6}$","C":"$P(E) = \\dfrac{1}{6},\\ P(F) = \\dfrac{1}{2}$","D":"$P(E) = \\dfrac{1}{4},\\ P(F) = \\dfrac{1}{3}$"},
 ["A", "D"],"medium",["probability", "independent-events", "quadratic"],None),

(38,"MATH","M04",2,9,
 "The straight line $y = mx + c$ intersects the circle $x^{2} + y^{2} = r^{2}$ at two distinct points if",
 {"A":"$-r\\sqrt{1 + m^{2}} < c \\leq 0$","B":"$0 \\leq c < r\\sqrt{1 + m^{2}}$","C":"$-c\\sqrt{1 - m^{2}} < r$","D":"$r < c\\sqrt{1 + m^{2}}$"},
 ["A", "B"],"medium",["circle", "line-circle-intersection", "perpendicular-distance"],None),

(39,"MATH","M02",2,9,
 "The system of equations — $ax + by + cz = q - r$, $bx + cy + az = r - p$, $cx + ay + bz = p - q$ is",
 {"A":"consistent if $p = q = r$.","B":"inconsistent if $a = b = c$ and $p \\neq q \\neq r$.","C":"consistent if $a, b, c$ are distinct and $a + b + c = 0$.","D":"inconsistent for any value of $a, b, c$."},
 ["A", "C"],"hard",["linear-system", "consistency", "circulant-determinant"],None),

(40,"MATH","M09",2,9,
 "The value of $\\displaystyle\\int_{1/a}^{a} \\dfrac{\\tan^{-1} x}{x}\\,dx$ is",
 {"A":"$\\dfrac{\\pi}{4}\\log a$","B":"$\\dfrac{\\pi}{2}\\log a$","C":"$\\pi \\log a$","D":"$\\dfrac{1}{2}\\log a$"},
 ["B"],"medium",["definite-integral", "substitution-x-to-1/x", "inverse-trig"],None),

# ---------------- PHYSICS Cat-I (Q41-65) ----------------
(41,"PHYS","P01",1,10,
 "The equation of state of some gases can be expressed as $\\left(P + \\dfrac{a}{V^{2}}\\right)(V - b) = RT$ where $P$ is pressure, $V$ is volume, $T$ is absolute temperature and $a, b, R$ are constants. The dimension of $'a'$ is",
 {"A":"$[MT^{5}T^{-2}]$","B":"$[ML^{-1}T^{-2}]$","C":"$[L^{3}]$","D":"$[L^{6}]$"},
 ["W"],"voided",["dimensions", "dimensional-analysis", "van-der-waals", "voided"],None),

(42,"PHYS","P01",1,10,
 "The resistance $R = \\dfrac{V}{I}$ where $V = 100 \\pm 5$ volts and $I = 10 \\pm 0{\\cdot}2$ amperes. The total percentage of error in $R$ is",
 {"A":"$5\\%$","B":"$7\\%$","C":"$5{\\cdot}2\\%$","D":"$9\\%$"},
 ["B"],"easy",["error-analysis", "percentage-error", "quotient"],None),

(43,"PHYS","P02",1,10,
 "If three vectors satisfy the relation $\\overline{A} \\cdot \\overline{B} = 0$ and $\\overline{A} \\cdot \\overline{C} = 0$, then $\\overline{A}$ can be parallel to",
 {"A":"$\\overline{C}$","B":"$\\overline{B}$","C":"$\\overline{B} \\times \\overline{C}$","D":"$\\overline{B} \\cdot \\overline{C}$"},
 ["C"],"easy",["vectors", "dot-product", "cross-product"],None),

(44,"PHYS","P02",1,10,
 "The acceleration of a particle varies with time as shown in the figure. The corresponding velocity—time graph will be [Assume at $t = 0$, velocity $v = 0$]",
 {"A":"Graph (A)","B":"Graph (B)","C":"Graph (C)","D":"Graph (D)"},
 ["C"],"medium",["kinematics", "acceleration-time-graph", "velocity-time-graph"],"fig-2025-q44"),

(45,"PHYS","P04",1,11,
 "A particle is shifted from a point $(0, 0, 1\\text{m})$ to a point $(1\\text{m}, 1\\text{m}, 2\\text{m})$ under the simultaneous action of forces. These forces are $\\overline{F}_{1} = (2\\hat{i} + 3\\hat{j} - \\hat{k})\\,N$ and $\\overline{F}_{2} = (\\hat{i} - 2\\hat{j} + 2\\hat{k})\\,N$. Find the work done by the resultant of these two forces.",
 {"A":"$4\\text{ J}$","B":"$1\\text{ J}$","C":"$5\\text{ J}$","D":"$3\\text{ J}$"},
 ["C"],"easy",["work", "dot-product", "resultant-force"],None),

(46,"PHYS","P02",1,11,
 "Figure shows the displacement of a particle moving along $x$ axis as a function of time. The acceleration of the particle is zero in the region",
 {"A":"$AB$ and $BC$","B":"$AB$ and $CD$","C":"$BC$ and $CD$","D":"$CD$ and $DE$"},
 ["B"],"easy",["kinematics", "displacement-time-graph", "acceleration"],"fig-2025-q46"),

(47,"PHYS","P02",1,11,
 "A stone is dropped from a certain height which can reach the ground in $5$ sec. It is stopped after $3$ sec. of its fall and is again released. The total time taken by the stone to reach the ground will be",
 {"A":"$6{\\cdot}0$ sec","B":"$6{\\cdot}5$ sec","C":"$7{\\cdot}0$ sec","D":"$7{\\cdot}5$ sec"},
 ["C"],"medium",["kinematics", "free-fall", "equations-of-motion"],None),

(48,"PHYS","P08",1,11,
 "A stone of relative density $\\rho$ is released from rest on the surface of a lake. If the viscous effects are ignored, the stone sinks in water with an acceleration of",
 {"A":"$g(1 - \\rho)$","B":"$g(1 + \\rho)$","C":"$g\\left(1 - \\dfrac{1}{\\rho}\\right)$","D":"$g\\left(1 + \\dfrac{1}{\\rho}\\right)$"},
 ["C"],"easy",["buoyancy", "archimedes-principle", "newtons-second-law"],None),

(49,"PHYS","P05",1,11,
 "An artificial satellite moving in circular orbit around the earth has a total energy (kinetic + potential energy) $E_{0}$. Its potential energy is",
 {"A":"$-E_{0}$","B":"$1{\\cdot}5E_{0}$","C":"$2E_{0}$","D":"$E_{0}$"},
 ["C"],"easy",["gravitation", "orbital-energy", "satellite"],None),

(50,"PHYS","P03",1,12,
 "A bomb initially at rest explodes by itself into three equal mass fragments. The velocities of two fragments are $(\\hat{i} + 3\\hat{j})\\ m/s$ and $(2\\hat{i} - 4\\hat{j})\\ m/s$. The velocity of the third fragment (in $m/s$) is",
 {"A":"$(-3\\hat{i} + \\hat{j})\\ m/s$","B":"$(3\\hat{i} - \\hat{j})\\ m/s$","C":"$(\\hat{i} - 3\\hat{j})\\ m/s$","D":"$(\\hat{i} + 3\\hat{j})\\ m/s$"},
 ["A"],"easy",["momentum-conservation", "explosion", "vectors"],None),

(51,"PHYS","P08",1,12,
 "Which of the graphs shown in figures represents the velocity – time ($v$–$t$) graph of a small spherical body falling in a viscous fluid? (Body just dropped on the surface of the viscous fluid)",
 {"A":"Graph (A)","B":"Graph (B)","C":"Graph (C)","D":"Graph (D)"},
 ["A"],"easy",["viscosity", "terminal-velocity", "velocity-time-graph"],None),

(52,"PHYS","P03",1,12,
 "A bullet hits horizontally and gets embedded in a solid block resting on a frictionless surface. In this process",
 {"A":"momentum is conserved.","B":"kinetic energy is conserved.","C":"both momentum and kinetic energy are conserved.","D":"neither momentum nor kinetic energy is conserved."},
 ["A"],"easy",["momentum-conservation", "inelastic-collision", "kinetic-energy"],None),

(53,"PHYS","P03",1,12,
 "The variation of density of a cylindrical thick and long rod is $\\rho = \\rho_{0}\\dfrac{x^{2}}{L^{2}}$ where $L$ is the length of rod and '$x$' is the position of an elementary mass from one end of the rod. Then the position of its centre of mass from $x$=0 end is",
 {"A":"$\\dfrac{2L}{3}$","B":"$\\dfrac{L}{2}$","C":"$\\dfrac{L}{3}$","D":"$\\dfrac{3L}{4}$"},
 ["D"],"medium",["centre-of-mass", "variable-density", "integration"],None),

(54,"PHYS","P04",1,13,
 "A disc of mass M and radius R rolls on a horizontal surface and then rolls up an inclined plane as shown in the figure. If the velocity of the disc is V, the height to which the disc will rise will be",
 {"A":"$\\dfrac{3V^{2}}{2g}$","B":"$\\dfrac{3V^{2}}{4g}$","C":"$\\dfrac{V^{2}}{4g}$","D":"$\\dfrac{V^{2}}{2g}$"},
 ["B"],"medium",["rolling-motion", "energy-conservation", "moment-of-inertia"],"fig-2025-q54"),

(55,"PHYS","P06",1,13,
 "The dimensions of two wires A and B are the same, but their materials are different. Their extension-load graph are shown in figure. If $Y_{A}$ and $Y_{B}$ are the values of Young's modulus of elasticity of A and B respectively, then",
 {"A":"$Y_{A} > Y_{B}$","B":"$Y_{A} < Y_{B}$","C":"$Y_{A} = Y_{B}$","D":"$Y_{B} = 2Y_{A}$"},
 ["A"],"easy",["youngs-modulus", "extension-load-graph", "elasticity"],"fig-2025-q55"),

(56,"PHYS","P08",1,13,
 "Two non-mixing liquids of densities $\\rho$ and $n\\rho$ ($n > 1$) are put in a container. The height of each liquid is $h$. A solid cylinder of length $L$ and density $d$ is put in this container. The cylinder floats with its axis vertical and length $pL$ ($p < 1$) in the denser liquid and the rest part within other liquid. The density '$d$' is equal to",
 {"A":"$\\{1 + (n + 1)p\\}\\rho$","B":"$\\{2 + (n + 1)p\\}\\rho$","C":"$\\{2 + (n - 1)p\\}\\rho$","D":"$\\{1 + (n - 1)p\\}\\rho$"},
 ["D"],"medium",["flotation", "archimedes-principle", "two-liquids"],None),

(57,"PHYS","P11",1,14,
 "When a system is taken from state '$a$' to state 'b' along the path '$a$cb', it is found that a quantity of heat Q = 200 J is absorbed by the system and a work W = 80 J is done by it. Along the path '$a$db', Q = 144 J. The work done along the path '$a$db' is",
 {"A":"$6$ J","B":"$12$ J","C":"$18$ J","D":"$24$ J"},
 ["D"],"easy",["first-law-of-thermodynamics", "internal-energy", "state-function"],"fig-2025-q57"),

(58,"PHYS","P11",1,14,
 "One mole of an ideal gas goes from an initial state A to final state B via two processes. It firstly undergoes isothermal expansion from volume V to 3V and then its volume is reduced from 3V to V at constant pressure. The correct P – V diagram representing the two processes is",
 {"A":"Graph (A)","B":"Graph (B)","C":"Graph (C)","D":"Graph (D)"},
 ["B"],"medium",["pv-diagram", "isothermal-process", "isobaric-process"],None),

(59,"PHYS","P03",1,14,
 "A particle is executing SHM along a straight line. Its velocities at distances $x_{1}$ and $x_{2}$ from the mean position are $\\nu_{1}$ and $\\nu_{2}$ respectively. Its time period is",
 {"A":"$2\\pi\\sqrt{\\dfrac{x_{2}^{2} - x_{1}^{2}}{\\nu_{1}^{2} - \\nu_{2}^{2}}}$","B":"$2\\pi\\sqrt{\\dfrac{\\nu_{1}^{2} + \\nu_{2}^{2}}{x_{1}^{2} + x_{2}^{2}}}$","C":"$2\\pi\\sqrt{\\dfrac{\\nu_{1}^{2} - \\nu_{2}^{2}}{x_{1}^{2} - x_{2}^{2}}}$","D":"$2\\pi\\sqrt{\\dfrac{x_{1}^{2} + x_{2}^{2}}{\\nu_{1}^{2} + \\nu_{2}^{2}}}$"},
 ["A"],"medium",["shm", "velocity-displacement-relation", "time-period"],None),

(60,"PHYS","P14",1,15,
 "A plano convex lens fits exactly into a plano concave lens. Their plane surfaces are parallel to each other. If lenses are made of different materials of refractive indices $\\mu_{1}$ & $\\mu_{2}$ and R is the radius of curvature of the curved surface of the lenses, the focal length of combination is",
 {"A":"$\\dfrac{2\\text{R}}{\\mu_{2} - \\mu_{1}}$","B":"$\\dfrac{\\text{R}}{2(\\mu_{1} + \\mu_{2})}$","C":"$\\dfrac{\\text{R}}{2(\\mu_{1} - \\mu_{2})}$","D":"$\\dfrac{\\text{R}}{\\mu_{1} - \\mu_{2}}$"},
 ["D"],"medium",["lens-makers-formula", "lens-combination", "focal-length"],None),

(61,"PHYS","P11",1,15,
 "The temperature of equal masses of three different liquids A, B and C are $10^{\\circ}$C, $15^{\\circ}$C and $20^{\\circ}$C respectively. The temperature when A and B are mixed is $13^{\\circ}$C and when B and C are mixed, it is $16^{\\circ}$C. What will be the temperature when A and C are mixed?",
 {"A":"$\\dfrac{140}{11}\\,^{\\circ}$C","B":"$\\dfrac{110}{14}\\,^{\\circ}$C","C":"$30^{\\circ}$C","D":"$15^{\\circ}$C"},
 ["A"],"medium",["calorimetry", "specific-heat", "principle-of-mixtures"],"fig-2025-q61"),

(62,"PHYS","P11",1,15,
 "A solid material is supplied with heat at a constant rate. The temperature of material is changing with heat input as shown in figure. What does the slope of DE represent?",
 {"A":"Latent heat of liquid","B":"Latent heat of vapour","C":"Heat capacity of vapour","D":"Inverse of heat capacity of vapour"},
 ["D"],"easy",["heating-curve", "heat-capacity", "latent-heat"],"fig-2025-q62"),

(63,"PHYS","P10",1,16,
 "The length and radii of two rods made of same material are in the ratio $1 : 2$ and $2 : 3$ respectively. The temperature difference between the ends for the two rods be the same in the steady state. The amount of heat flowing per second through them will be in the ratio of",
 {"A":"$1 : 3$","B":"$4 : 3$","C":"$8 : 9$","D":"$3 : 2$"},
 ["C"],"easy",["thermal-conduction", "steady-state", "heat-current"],None),

(64,"PHYS","P15",1,16,
 "Surfaces of two metal block A and B of same dimension made of same metal are illuminated with light of wavelength $\\lambda_{1} = 350$ nm and $\\lambda_{2} = 540$ nm respectively. If $\\text{V}_{1}$ and $\\text{V}_{2}$ represent the maximum speed of the photo-electrons emitted from block A and B repectively, then",
 {"A":"$\\text{V}_{1} = \\text{V}_{2}$","B":"$\\text{V}_{1} > \\text{V}_{2}$","C":"$\\text{V}_{1} < \\text{V}_{2}$","D":"the relation between $\\text{V}_{1}$ and $\\text{V}_{2}$ can not be predicted from the supplied data."},
 ["B"],"easy",["photoelectric-effect", "einstein-equation", "maximum-speed"],None),

(65,"PHYS","P08",1,16,
 "A spherical ball of radius $1 \\times 10^{-4}$m and density $10^{4}$kg/m$^{3}$ falls freely under gravity through a distance $h$ before entering a tank of water. If the velocity of the ball does not change after entering the water, find $h$. (Viscosity of water is $9{\\cdot}8 \\times 10^{-6}$ N – S/m$^{2}$)",
 {"A":"$20{\\cdot}41$ m","B":"$2{\\cdot}041$ m","C":"$0{\\cdot}2041$ m","D":"$204{\\cdot}1$ m"},
 ["A"],"medium",["terminal-velocity", "stokes-law", "free-fall"],None),

# ---------------- PHYSICS Cat-II (Q66-70) ----------------
(66,"PHYS","P02",2,17,
 "A car starts from rest and accelerates uniformly for $4$ sec and then moves with uniform velocity. Which of the following displacement ($x$) – time (t) graph represents the motion of the car?",
 {"A":"Graph (A)","B":"Graph (B)","C":"Graph (C)","D":"Graph (D)"},
 ["D"],"medium",["kinematics", "displacement-time-graph", "uniform-acceleration"],None),

(67,"PHYS","P03",2,17,
 "A block of mass 2kg is hanging over a smooth and light pulley through a light string. The other end of the string is pulled by a constant force F = 40 N. At t = 0 the system is at rest as shown. Then in the time interval from t = 0 to $t = \\dfrac{2}{\\sqrt{10}}$ sec, pick up the correct statement(s).(g = 10 m/s$^{2}$)",
 {"A":"Tension in the string is 20 N.","B":"Work done by gravity is –20 J.","C":"Workdone by tension on block is 80 J.","D":"Displacement of the block is 2 m."},
 ["C", "D"],"medium",["newtons-laws", "pulley", "work-done"],"fig-2025-q67"),

(68,"PHYS","P05",2,18,
 "A planet revolving around the Sun in an elliptical orbit has a constant",
 {"A":"Kinetic energy.","B":"angular momentum about the Sun.","C":"Potential energy.","D":"total energy."},
 ["B", "D"],"easy",["kepler-laws", "angular-momentum-conservation", "orbital-energy"],None),

(69,"PHYS","P11",2,18,
 "5kg of steam at $100^{\\circ}$C is mixed with 10kg of ice at $0^{\\circ}$C. Choose the correct alternative(/s). (Given $\\text{S}_{\\text{water}} = 1$ Cal/g$^{\\circ}$C , $\\text{L}_{\\text{F}} = 80$ Cal/g, $\\text{L}_{\\text{v}} = 540$ Cal/g.)",
 {"A":"Equilibrium temperature of the mixture is $160^{\\circ}$C.","B":"Equilibrium temperature of the mixture is $100^{\\circ}$C.","C":"At Equilibrium mixture contains $13\\dfrac{1}{3}$ kg of water.","D":"At Equilibrium, mixture contains $1\\dfrac{2}{3}$ kg of steam."},
 ["B", "C", "D"],"medium",["calorimetry", "latent-heat", "phase-equilibrium"],None),

(70,"PHYS","P02",2,18,
 "For a vector, $\\overline{P} = \\left(\\overline{A} \\times \\overline{B}\\right) \\times \\left(\\overline{C} \\times \\overline{D}\\right)$, choose the correct alternative(/s).",
 {"A":"Vector $\\overline{P}$ is perpendicular to the plane containing $\\overline{A}$ and $\\overline{B}$.","B":"$\\overline{P}$ resides in a plane containing $\\overline{A}$ and $\\overline{B}$.","C":"$\\overline{P}$ resides in a plane containing $\\overline{C}$ and $\\overline{D}$.","D":"$\\overline{P}$ is parallel to the line of intersection of two planes containing $\\overline{A}$, $\\overline{B}$ and $\\overline{C}$, $\\overline{D}$ respectively."},
 ["B", "C", "D"],"hard",["vectors", "vector-triple-product", "cross-product"],None),

# ---------------- CHEMISTRY Cat-I (Q71-85) ----------------
(71,"CHEM","C01",1,19,
 "An orbital having $n = 5$ and $l = 3$ is designated as",
 {"A":"$5s$","B":"$5p$","C":"$5d$","D":"$5f$"},
 ["D"],"easy",["quantum-numbers", "orbital-designation", "azimuthal-quantum-number"],None),

(72,"CHEM","C02",1,19,
 "How many types of P–Cl bonds are present in PCl$_{5}$ molecule?",
 {"A":"One","B":"Two","C":"Three","D":"Five"},
 ["B"],"easy",["vsepr", "trigonal-bipyramidal", "axial-equatorial-bonds"],None),

(73,"CHEM","C01",1,19,
 "Silicon doped with electron-rich impurity forms",
 {"A":"Insulator","B":"$p$-type semiconductor","C":"$n$-type  semiconductor","D":"amorphous powder"},
 ["C"],"easy",["semiconductors", "doping", "n-type"],None),

(74,"CHEM","C04",1,19,
 "NO reacts with N$_{2}$O$_{4}$ in a basic solution to form NO$_{2}^{-}$. The reaction is classified as",
 {"A":"Decomposition","B":"Disproportionation","C":"Comproportionation","D":"Acid-Base"},
 ["C"],"medium",["redox", "oxidation-number", "comproportionation"],None),

(75,"CHEM","C03",1,19,
 "Suppose solution X has a pH of 6.0 and solution Y has a pH of 7.0. Which of the following statements about two solutions is correct?",
 {"A":"Both X and Y are acidic.","B":"Solution X is 10 times more acidic than solution Y.","C":"$\\left[\\text{OH}^{-}\\right] > \\left[\\text{H}^{+}\\right]$ in solution Y.","D":"None of the above"},
 ["B"],"easy",["ph-scale", "hydrogen-ion-concentration", "neutral-solution"],None),

(76,"CHEM","C04",1,19,
 "The standard EMF for the cell reaction Zn + Cu$^{2+}$ $\\rightleftharpoons$ Cu + Zn$^{2+}$ is 1.10V at 25°C. The EMF for the cell reaction, when 0.1M Cu$^{2+}$ and 0.1 M Zn$^{2+}$ solutions are used, at 25°C is",
 {"A":"1.10 V","B":"0.110 V","C":"–1.10 V","D":"–0.110 V"},
 ["A"],"medium",["electrochemistry","emf","nernst-equation"],None),

(77,"CHEM","C05",1,20,
 "In which of the following equilibria would a decrease in volume promote the formation of more products?",
 {"A":"N$_{2}$(g) + O$_{2}$(g) $\\rightleftharpoons$ 2NO(g)","B":"N$_{2}$O$_{4}$(g) $\\rightleftharpoons$ 2NO$_{2}$(g)","C":"H$_{2}$O($l$) + CO$_{2}$(g) $\\rightleftharpoons$ H$_{2}$CO$_{3}$(aq.)","D":"CaCO$_{3}$(s) $\\rightleftharpoons$ CaO(s) + CO$_{2}$(g)"},
 ["C"],"medium",["equilibrium","le-chatelier","pressure-volume"],None),

(78,"CHEM","C03",1,20,
 "Which of the following salts will give highest pH in water?",
 {"A":"KCl","B":"NaCl","C":"Na$_{2}$CO$_{3}$","D":"CuSO$_{4}$"},
 ["C"],"easy",["salt-hydrolysis","ph","basic-salt"],None),

(79,"CHEM","C04",1,20,
 "Which of the following metals can be obtained by the electrolysis of an aqueous solution of their salts?",
 {"A":"Na","B":"Mg","C":"Ca","D":"Al"},
 ["W"],"voided",["electrolysis","aqueous-electrolysis","reduction-potential"],None),

(80,"CHEM","C04",1,20,
 "In the following conversion, how many electrons are involved? $N_{2} \\longrightarrow NH_{3}$",
 {"A":"2","B":"3","C":"4","D":"6"},
 ["D"],"medium",["redox","oxidation-number","electron-count"],None),

(81,"CHEM","C08",1,20,
 "IUPAC name of the following compound is",
 {"A":"3-(2-Methylpropyl) hept-1-en-4-yne","B":"2-Methyl-4-ethenyl-oct-5-yne","C":"7-Methyl-5-ethenyl-oct-3-yne","D":"None of the above"},
 ["A"],"hard",["organic","iupac-nomenclature","enyne"],"fig-2025-q81"),

(82,"CHEM","C08",1,20,
 "Which structural isomerism is exhibited by the following pairs?",
 {"A":"Positional Isomerism","B":"Chain Isomerism","C":"Functional Isomerism","D":"Geometrical Isomerism"},
 ["C"],"easy",["organic","structural-isomerism","functional-isomers"],"fig-2025-q82"),

(83,"CHEM","C08",1,21,
 "The major product in the following reaction is",
 {"A":"CH$_{4}$","B":"C$_{2}$H$_{6}$","C":"CH$_{3}$COOCH$_{3}$","D":"None of these"},
 ["A"],"medium",["organic","grignard-reagent","acidic-hydrogen"],"fig-2025-q83"),

(84,"CHEM","C08",1,21,
 "The hybridization state of a carbanion is",
 {"A":"$sp$","B":"$sp^{2}$","C":"$sp^{3}$","D":"$sp^{4}$"},
 ["W"],"voided",["organic","reactive-intermediates","hybridization"],None),

(85,"CHEM","C08",1,21,
 "The major product in the following reaction is",
 {"A":"Structure (A)","B":"CH$_{3}$CH$_{2}$—C$\\equiv$C—CH$_{2}$CH$_{3}$","C":"Structure (C)","D":"Structure (D)"},
 ["B"],"medium",["organic","alkyne-alkylation","acetylide"],"fig-2025-q85"),

# ---------------- CHEMISTRY Cat-II (Q86-90) ----------------
(86,"CHEM","C01",2,22,
 "In Rutherford's gold leaf experiment, the scattering of $\\alpha$-particles takes place. In this process (I) coulombic force is involved (II) nuclear force is involved (III) path of $\\alpha$-particle is parabolic (IV) path of $\\alpha$-particle is hyperbolic",
 {"A":"I","B":"II","C":"III","D":"IV"},
 ["A","D"],"medium",["atomic-structure","rutherford-scattering","coulomb-force"],None),

(87,"CHEM","C03",2,22,
 "By adding water to the solution of ionic compound, its (I) concentration remains same. (II) concentration increases. (III) ionization may increase. (IV) concentration decreases.",
 {"A":"I","B":"II","C":"III","D":"IV"},
 ["C","D"],"medium",["dilution","degree-of-ionization","ostwald-dilution-law"],None),

(88,"CHEM","C08",2,22,
 "The product(s) in the following reaction is/are",
 {"A":"I","B":"II","C":"I and II","D":"III and IV"},
 ["A","B","C"],"hard",["organic","hbr-addition","carbocation-rearrangement"],"fig-2025-q88"),

(89,"CHEM","C05",2,23,
 "For which of the following reactions, k$_{\\text{p}}$ is less than k$_{\\text{c}}$? (I) N$_{2}$O$_{4}$ $\\rightleftharpoons$ 2NO$_{2}$ (II) N$_{2}$ + 3H$_{2}$ $\\rightleftharpoons$ 2NH$_{3}$ (III) H$_{2}$ + I$_{2}$ $\\rightleftharpoons$ 2HI (IV) CO + H$_{2}$O $\\rightleftharpoons$ CO$_{2}$ + H$_{2}$",
 {"A":"I","B":"II","C":"III","D":"IV"},
 ["B"],"medium",["equilibrium","kp-kc","delta-n-gas"],None),

(90,"CHEM","C03",2,23,
 "Which of the following statement about HNO$_{3}$ is/are correct?",
 {"A":"It is a solid.","B":"It is an oxoacid of nitrogen.","C":"It is a reducing agent.","D":"It is an oxidizing agent."},
 ["B","D"],"easy",["nitric-acid","oxoacids","oxidizing-agent"],None),

# ---------------- FEEE Cat-I (Q91-100) ----------------
(91,"FEEE","E01",1,24,
 "A PMMC ammeter measures current $i(t) = (5 + 5\\sin 100\\pi t)\\,A$. The reading of the meter will be",
 {"A":"5 A","B":"$\\left(5 + \\dfrac{5}{\\sqrt{2}}\\right)A$","C":"0 A","D":"None of these"},
 ["A"],"medium",["pmmc","average-value","measuring-instruments"],None),

(92,"FEEE","E02",1,24,
 "An ideal single phase transformer with 200V, 50Hz supply at its primary side is delivering to 100 watt resistive load at 10V connected to its secondary side. The current drawn by the transformer from the supply is",
 {"A":"0A","B":"0$\\cdot$5A","C":"1$\\cdot$0A","D":"10A"},
 ["B"],"easy",["ideal-transformer","power-balance","primary-current"],None),

(93,"FEEE","E03",1,24,
 "Which of the following electrical machines has the highest efficiency?",
 {"A":"DC shunt motor","B":"DC series motor","C":"Single phase induction motor","D":"Transformer"},
 ["D"],"easy",["electrical-machines","efficiency","transformer"],None),

(94,"FEEE","E04",1,24,
 "A power supply has a full load voltage of 10V. Its no load voltage for 0% regulation is",
 {"A":"10V","B":"0V","C":"less than 10V","D":"greater than 10V"},
 ["A"],"easy",["voltage-regulation","power-supply","dc-sources"],None),

(95,"FEEE","E05",1,24,
 "The following circuit carries alternating currents I, I$_{1}$ and I$_{2}$. Under which condition I$_{1}$, I$_{2}$ and I will be in the same phase? (The frequency of the alternating current is 50Hz)",
 {"A":"$R_{1}R_{2} = L_{1}L_{2}$","B":"$\\dfrac{R_{1}}{R_{2}} = \\dfrac{L_{1}}{L_{2}}$","C":"$R_{1}L_{1} = R_{2}L_{2}$","D":"None of these"},
 ["B"],"medium",["ac-circuit","parallel-rl","phase-angle"],"fig-2025-q95"),

(96,"FEEE","E06",1,25,
 "In a PNP transistor, the emitter current $(I_{E})$ is 10mA and the base current $(I_{B})$ is 0$\\cdot$1mA. Its collector current $(I_{C})$ would be",
 {"A":"9$\\cdot$9 mA","B":"10$\\cdot$1 mA","C":"100 mA","D":"0$\\cdot$9 mA"},
 ["A"],"easy",["bjt","pnp-transistor","kcl"],None),

(97,"FEEE","E06",1,25,
 "Which statement is valid for CMOS technology?",
 {"A":"Employs only N-type MOSFETs","B":"Employs only P-type MOSFETs","C":"Consumes high static power","D":"Employs both N-type and P-type MOSFETs"},
 ["D"],"easy",["cmos","mosfet","digital-ic-technology"],None),

(98,"FEEE","E07",1,25,
 "Which of the OPAMP based configurations provides no phase difference between input and output?",
 {"A":"Inverting amplifier","B":"Non-inverting amplifier","C":"Integrator","D":"Differentiator"},
 ["B"],"easy",["op-amp","non-inverting-amplifier","phase-shift"],None),

(99,"FEEE","E08",1,25,
 "Simplify the Boolean Expression: $(A + B).(A + B') + A'$",
 {"A":"A+B","B":"1","C":"B","D":"$A'$"},
 ["B"],"easy",["boolean-algebra","simplification","complement-law"],None),

(100,"FEEE","E08",1,25,
 "The combination of Logic Gates in the following circuit is equivalent to",
 {"A":"XOR Gate","B":"AND Gate","C":"XNOR Gate","D":"NAND Gate"},
 ["B"],"medium",["logic-gates","nand-universal","truth-table"],"fig-2025-q100"),
]


# Per-option figures (graphical options) and descriptive alt text for stem figures.
# OPTION_FIGURES_2025[qNumber][optionId] = (figureKey, alt)
OPTION_FIGURES_2025 = {
    44: {
        "A": ("fig-2025-q44-optA", "Graph (A): v (m/s) versus t (s); an inverted parabola starting at v = 0 at t = 0, maximum at t = 1 (dotted line), back to v = 0 at t = 2"),
        "B": ("fig-2025-q44-optB", "Graph (B): v (m/s) versus t (s); v = 0 from t = 0 to t = 1, then rising linearly, then constant"),
        "C": ("fig-2025-q44-optC", "Graph (C): v (m/s) versus t (s); starts at v = 0, dips below the t-axis to a minimum at t = 1 (dotted line), crosses zero at t = 2 and then rises steeply"),
        "D": ("fig-2025-q44-optD", "Graph (D): v (m/s) versus t (s); a trapezium rising linearly from 0 to t = 1, constant from t = 1 to t = 2 (dotted verticals), then falling linearly to zero"),
    },
    51: {
        "A": ("fig-2025-q51-optA", "Graph (A): v versus t; v starts at 0, rises along an S-shaped curve and levels off to a constant value"),
        "B": ("fig-2025-q51-optB", "Graph (B): v versus t; v starts at a large value on the v-axis and decreases, levelling off to a constant value"),
        "C": ("fig-2025-q51-optC", "Graph (C): v versus t; v rises from 0 to a maximum, then falls steeply back towards zero"),
        "D": ("fig-2025-q51-optD", "Graph (D): v versus t; v rises linearly from 0, stays constant for a while, then rises steeply again"),
    },
    58: {
        "A": ("fig-2025-q58-optA", "Graph (A): P–V diagram; a straight sloping line from A at V down to 3V, then a horizontal line at lower pressure back to B at V"),
        "B": ("fig-2025-q58-optB", "Graph (B): P–V diagram; a curve falling from A at V to 3V, then a horizontal line at the lower pressure back to B at V"),
        "C": ("fig-2025-q58-optC", "Graph (C): P–V diagram; a horizontal line from A at V to 3V, then a curve rising from 3V back to B at V"),
        "D": ("fig-2025-q58-optD", "Graph (D): P–V diagram; a curve falling from A at V to 3V, then a straight line sloping down back to B at V at a lower pressure"),
    },
    66: {
        "A": ("fig-2025-q66-optA", "Graph (A): x versus t; x rises along a concave-down curve until t = 4, then decreases along a straight line"),
        "B": ("fig-2025-q66-optB", "Graph (B): x versus t; x rises along a concave-down curve until t = 4, then rises along a much steeper straight line"),
        "C": ("fig-2025-q66-optC", "Graph (C): x versus t; x rises along a concave-up curve until t = 4, then stays constant"),
        "D": ("fig-2025-q66-optD", "Graph (D): x versus t; x rises along a concave-up curve from the origin until t = 4, then continues as a straight line tangent to the curve"),
    },
    85: {
        "A": ("fig-2025-q85-optA", "Structure (A): CH3CH2 at the left joined to a trans C=C drawn skeletally, ending in CH2CH3 at the lower right (CH3CH2–CH=CH–CH2CH3)"),
        "C": ("fig-2025-q85-optC", "Structure (C): CH3CH2 at the left joined to a trans C=C drawn skeletally, ending in NH2 at the lower right (CH3CH2–CH=CH–NH2)"),
        "D": ("fig-2025-q85-optD", "Structure (D): Br at the upper left joined to a trans C=C drawn skeletally, ending in NH2 at the lower right (Br–CH=CH–NH2)"),
    },
}
STEM_FIGURE_ALT_2025 = {
    44: "Acceleration a (m/s²) versus time t (s): a straight line starting at a = −2 when t = 0, crossing a = 0 at t = 1 and continuing upward",
    46: "Displacement versus time: AB is a straight rising segment, BC a curved dip, CD a straight falling segment, and DE a curve rising from D and flattening towards E",
    54: "A disc on a horizontal surface moving with velocity V towards a concave-up curved incline; it rises to height h, shown by a dashed vertical line",
    55: "Extension (vertical axis) versus load (horizontal axis) for wires A and B: straight lines through the origin, B steeper than A",
    57: "P–V diagram: rectangle with a at bottom-left, c top-left, b top-right, d bottom-right; arrows a→c→b and a→d→b, plus a curved path from b back to a",
    61: "Liquids A, B, C of equal mass m at 10ºC, 15ºC and 20ºC; an arc joining A and B is labelled 13ºC and an arc joining B and C is labelled 16ºC",
    62: "Temperature versus heat input: rising from the origin to A, flat from A to B, rising from B to C, flat from C to D, rising again from D to E",
    81: "Condensed structure: CH3–CH2–C≡C–CH, where the CH carries an upper branch CH2–CH(CH3)2 and a lower branch CH=CH2",
    82: "Two skeletal structures side by side: left, a three-carbon chain ending in C(=O)OH; right, H–C(=O)–O–CH2–CH3",
    83: "Reaction scheme: CH3Cl, arrow labelled (i) Mg/Ether above and (ii) CH3COOH below",
    85: "Reaction scheme: HC≡CH, arrow labelled (i) NaNH2/liq. NH3 above and (ii) Ethylbromide (excess) below",
    88: "Reaction: CH3–C(CH3)2–CH=CH2 with HBr over the arrow. Structures: (I) CH3–C(CH3)2–CH(Br)–CH3; (II) CH3–C(CH3)(Br)–CH(CH3)–CH3; (III) CH3–C(CH3)2–CH2–CH2Br; (IV) BrCH2–C(CH3)(H)–CH(CH3)–CH3",
    95: "Circuit: current I enters a node and splits into I1 through R1 in series with L1 (upper branch) and I2 through R2 in series with L2 (lower branch); the branches rejoin at the right",
    100: "Logic circuit: inputs A and B both feed each of two NAND gates; the two NAND outputs feed the two inputs of a third NAND gate whose output is Y",
    67: "A fixed smooth pulley hanging from a ceiling; a 2 kg block hangs on the left of the string and the right end is pulled down by F = 40 N",
}
