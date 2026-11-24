# JELET 2024 Paper-I Set A — question data, validated against WBJEEB Final Answer Key WBE/Ex-71 (01-08-2024).
# Q1–Q40 (Mathematics): verbatim visual transcription from the official Set A booklet (PDF pages 3–10). Q41–Q100: older OCR, pending Batches B/C.
# Each entry: (qNumber, subjectId, unitId, category, pdfPage, stemLatex, {A,B,C,D: latex}, correct(list), difficulty, tags, figureKeyOrNone)

Q2024 = [
# ---------------- MATHEMATICS Cat-I (Q1-30) ----------------
# Q1–Q40: verbatim visual transcription from 180-DPI renders of the official Set A booklet
# (PDF pages 3–10, read with read_file before editing). Raw strings keep LaTeX backslashes intact.
(1,"MATH","M01",1,3,
 r"If $A$ and $B$ are real orthogonal matrices of same order and $\det(A) + \det(B) = 0$, then $A + B$ is",
 {"A":r"a singular matrix.","B":r"a symmetric matrix.","C":r"an orthogonal matrix.","D":r"$(A + B)^{-1}$ exists."},
 ["A"],"medium",["orthogonal-matrix","determinant","singular"],None),

(2,"MATH","M01",1,3,
 r"For the matrix $A = \begin{pmatrix} 1 & 0 & 3 \\ 4 & -1 & 5 \\ 2 & 0 & 6 \end{pmatrix}$, which of the following is correct ?",
 {"A":r"$\operatorname{rank} A = 0$","B":r"$\operatorname{rank} A = 1$","C":r"$\operatorname{rank} A = 2$","D":r"$\operatorname{rank} A = 3$"},
 ["C"],"easy",["rank","minor","singular-matrix"],None),

(3,"MATH","M01",1,3,
 r"If $A = \begin{pmatrix} 3 & -4 \\ 1 & -1 \end{pmatrix}$, then $A^{K}$ (where $K$ is any positive integer) is",
 {"A":r"$\begin{pmatrix} 1+2K & -4K \\ K & 1-2K \end{pmatrix}$","B":r"$\begin{pmatrix} 1+2K & -4K \\ K & 1-3K \end{pmatrix}$","C":r"$\begin{pmatrix} 1+K^{2} & -4K^{2} \\ K^{2} & 1-3K^{2} \end{pmatrix}$","D":r"$\begin{pmatrix} K & 0 \\ 0 & K \end{pmatrix}$"},
 ["A"],"medium",["matrix-power","nilpotent","induction"],None),

(4,"MATH","M02",1,3,
 r"If $p\lambda^{4} + q\lambda^{3} + r\lambda^{2} + s\lambda + t = \begin{vmatrix} \lambda^{2}+3\lambda & \lambda-1 & \lambda+3 \\ \lambda+1 & 2-\lambda & \lambda-3 \\ \lambda-3 & \lambda+4 & 3\lambda \end{vmatrix}$, then $t =$",
 {"A":r"$33$","B":r"$22$","C":r"$21$","D":r"$-33$"},
 ["C"],"easy",["determinant","polynomial-identity","constant-term"],None),

(5,"MATH","M02",1,4,
 r"If $\Delta_{1} = \begin{vmatrix} x & b & b \\ a & x & b \\ a & a & x \end{vmatrix}$ and $\Delta_{2} = \begin{vmatrix} x & b \\ a & x \end{vmatrix}$ are the given determinants, then",
 {"A":r"$\Delta_{1} = 3(\Delta_{2})^{2}$","B":r"$\dfrac{d}{dx}(\Delta_{1}) = 3\Delta_{2}$","C":r"$\dfrac{d}{dx}(\Delta_{1}) = 3(\Delta_{2})^{2}$","D":r"$\Delta_{1} = 3(\Delta_{2})^{4}$"},
 ["B"],"medium",["determinant","differentiation-of-determinant"],None),

(6,"MATH","M02",1,4,
 r"If $\begin{vmatrix} a^{2} & bc & ac+c^{2} \\ a^{2}+ab & b^{2} & ac \\ ab & b^{2}+bc & c^{2} \end{vmatrix} = Ka^{2}b^{2}c^{2}$ Where $a, b, c$ are real numbers, then $K =$",
 {"A":r"$2$","B":r"$4$","C":r"$8$","D":r"$16$"},
 ["B"],"medium",["determinant","factorisation","row-operations"],None),

(7,"MATH","M03",1,4,
 r"If $x = e^{i\theta}$ and $y = e^{i\phi}$, then the value of $\dfrac{x^{m}}{y^{n}} + \dfrac{y^{n}}{x^{m}}$, where $m, n$ are integers is",
 {"A":r"$2\cos(m\phi - n\theta)$","B":r"$2\cos(m\theta - n\phi)$","C":r"$2\cos(m - n)\theta$","D":r"$2\cos(m - n)\phi$"},
 ["B"],"easy",["euler-form","de-moivre","complex-number"],None),

(8,"MATH","M03",1,4,
 r"If the ratio $\dfrac{Z - i}{Z - 1}$ where $Z$ represents a complex number, is purely imaginary, then the point lies on",
 {"A":r"an ellipse","B":r"a circle","C":r"a hyperbola","D":r"a parabola"},
 ["B"],"medium",["complex-locus","purely-imaginary","circle"],None),

(9,"MATH","M07",1,4,
 r"If the normal to the curve $xy = e^{2}$ at the point $\left(et_{1}, \dfrac{e}{t_{1}}\right)$ meets the curve again at the point $\left(et_{2}, \dfrac{e}{t_{2}}\right)$, then which of the following is true ?",
 {"A":r"$(t_{1}t_{2})^{2} + 1 = 0$","B":r"$t_{1}^{3}t_{2} = -1$","C":r"$t_{1}^{3}t_{2} = 1$","D":r"$(t_{1}t_{2})^{2} - 1 = 0$"},
 ["B"],"medium",["normal","rectangular-hyperbola","parametric-point"],None),

(10,"MATH","M04",1,5,
 r"The length of the tangent drawn from any point on the circle $x^{2} + y^{2} + 2gx + 2fy + c = 0$ to the circle $x^{2} + y^{2} + 2gx + 2fy + c' = 0$, is",
 {"A":r"$(c - c')$","B":r"$(c' - c)^{\frac{1}{2}}$","C":r"$(c - c')^{\frac{1}{2}}$","D":r"$(c^{2} + c'^{2} - 2cc')^{\frac{1}{2}}$"},
 ["B"],"medium",["circle","tangent-length","power-of-a-point"],None),

(11,"MATH","M05",1,5,
 r"If $\left|\vec{A} + \vec{B}\right| = \left|\vec{A} - \vec{B}\right|$, then the angle between the vectors $\vec{A}$ and $\vec{B}$ is,",
 {"A":r"$\pi$","B":r"$\dfrac{\pi}{2}$","C":r"$\dfrac{\pi}{3}$","D":r"$\dfrac{\pi}{4}$"},
 ["B"],"easy",["vectors","dot-product","perpendicular"],None),

(12,"MATH","M05",1,5,
 r"Three vectors $\vec{a}$, $\vec{b}$, $\vec{c}$ satisfy the condition $\vec{a} + \vec{b} + \vec{c} = \vec{0}$, where $|\vec{a}| = 3$, $|\vec{b}| = 4$, $|\vec{c}| = 2$, then the value of $\vec{a}\cdot\vec{b} + \vec{b}\cdot\vec{c} + \vec{c}\cdot\vec{a}$ is",
 {"A":r"$\dfrac{28}{3}$","B":r"$-\dfrac{29}{2}$","C":r"$\dfrac{29}{2}$","D":r"$\dfrac{26}{3}$"},
 ["B"],"easy",["vectors","dot-product","square-of-sum"],None),

(13,"MATH","M05",1,5,
 r"A particle acted on by constant forces $4\hat{i} + \hat{j} - 3\hat{k}$ and $3\hat{i} + \hat{j} - \hat{k}$ is displaced from the point $\hat{i} + 2\hat{j} + 3\hat{k}$ to the point $5\hat{i} + 4\hat{j} + \hat{k}$, then the work done by the forces is",
 {"A":r"$36$ units","B":r"$40$ units","C":r"$42$ units","D":r"$60$ units"},
 ["B"],"easy",["vectors","work-done","dot-product"],None),

(14,"MATH","M06",1,5,
 r"The domain of the function $f(x) = \sin^{-1}\log_{2}\left(\dfrac{x^{2}}{2}\right)$ is",
 {"A":r"$[-2, -1] \cup [1, 2]$","B":r"$[-\sqrt{2}, -1] \cup [1, 2]$","C":r"$[-\sqrt{2}, -1] \cup [1, \sqrt{2}]$","D":r"$[-2, -1] \cup [1, \sqrt{2}]$"},
 ["A"],"medium",["domain","inverse-trigonometric","logarithm"],None),

(15,"MATH","M06",1,6,
 r"If $f'(a)$ exist then $\displaystyle\lim_{h \to 0} \dfrac{f(a + h) - f(a - h)}{h}$ is equal to",
 {"A":r"$f(a)$","B":r"$f'(a)$","C":r"$2f'(a)$","D":r"$f(a) + f'(a)$"},
 ["C"],"easy",["limit","derivative","symmetric-difference"],None),

(16,"MATH","M06",1,6,
 r"The value of $f(\pi)$ for which $f(x) = \dfrac{1 - \cos 7(x - \pi)}{x - \pi}$ is continuous is",
 {"A":r"$7$","B":r"$\dfrac{7}{2}$","C":r"$-7$","D":r"$0$"},
 ["D"],"easy",["continuity","limit","removable-discontinuity"],None),

(17,"MATH","M06",1,6,
 r"Let $f : [a, b] \longrightarrow \mathbb{R}$ be a continuous function on $[a, b]$ and $f$ is differentiable on $(a, b)$. If $f'(x) = 0$, for all $x \in (a, b)$, then which of the following is correct ?",
 {"A":r"$f(x) = kx$, for some constant $k$ and for all $x \in [a, b]$.","B":r"$f(x) = \text{constant}$, for all $x \in [a, b]$.","C":r"$f(x) = kx^{2}$, for some constant $k$ and for all $x \in [a, b]$.","D":r"None of the above"},
 ["B"],"easy",["mean-value-theorem","constant-function","derivative"],None),

(18,"MATH","M07",1,6,
 r"The function $f(x) = 2\log_{e}(x - 2) - x^{2} + 4x + 1$, increases in the interval.",
 {"A":r"$(1, 2)$","B":r"$(2, 3)$","C":r"$(1, 4)$","D":r"$(2, 4)$"},
 ["B"],"medium",["increasing-function","derivative-sign","logarithm"],None),

(19,"MATH","M07",1,6,
 r"The maximum value of $xy$ subject to the condition $3x + 4y = 5$, is",
 {"A":r"$\dfrac{26}{48}$","B":r"$\dfrac{25}{48}$","C":r"$\dfrac{24}{48}$","D":r"$\dfrac{23}{48}$"},
 ["B"],"easy",["maxima-minima","constraint","quadratic"],None),

(20,"MATH","M08",1,6,
 r"If $u = \tan^{-1}\dfrac{x^{3} + y^{3}}{x - y}$, then",
 {"A":r"$x\dfrac{\partial u}{\partial x} + y\dfrac{\partial u}{\partial y} = \sin 2u$","B":r"$x\dfrac{\partial u}{\partial x} + y\dfrac{\partial u}{\partial y} = \cos 2u$","C":r"$x\dfrac{\partial u}{\partial x} + y\dfrac{\partial u}{\partial y} = 2\tan u$","D":r"$x\dfrac{\partial u}{\partial x} + y\dfrac{\partial u}{\partial y} = 2\cot u$"},
 ["A"],"medium",["euler-theorem","homogeneous-function","inverse-trigonometric"],None),

(21,"MATH","M08",1,7,
 r"If $u(x, y, z) = \log(x^{3} + y^{3} + z^{3} - 3xyz)$, then $\dfrac{\partial u}{\partial x} + \dfrac{\partial u}{\partial y} + \dfrac{\partial u}{\partial z}$ is equal to",
 {"A":r"$0$","B":r"$\dfrac{1}{x+y+z}$","C":r"$\dfrac{3}{x+y+z}$","D":r"$-\dfrac{3}{(x+y+z)^{2}}$"},
 ["C"],"medium",["partial-differentiation","logarithm","cubic-identity"],None),

(22,"MATH","M09",1,7,
 r"The value of $\displaystyle\int_{-1}^{1} \left(|x| + e^{|x|}\right)dx$ is",
 {"A":r"$2(e - 1)$","B":r"$2(e + 1)$","C":r"$2e - 1$","D":r"$2e + 1$"},
 ["C"],"easy",["definite-integral","even-function","modulus"],None),

(23,"MATH","M09",1,7,
 r"If $\displaystyle\int \dfrac{\cos 4x + 1}{\cot x - \tan x}\,dx = k\cos 4x + c$, then $k =$",
 {"A":r"$-\dfrac{1}{2}$","B":r"$\dfrac{1}{2}$","C":r"$\dfrac{1}{4}$","D":r"$-\dfrac{1}{8}$"},
 ["D"],"medium",["indefinite-integral","trigonometric-identity","double-angle"],None),

(24,"MATH","M09",1,7,
 r"The value of $\displaystyle\int_{0}^{\pi/2} \dfrac{dx}{1 + \tan^{3}x}$ is",
 {"A":r"$0$","B":r"$1$","C":r"$\dfrac{\pi}{2}$","D":r"$\dfrac{\pi}{4}$"},
 ["D"],"medium",["definite-integral","king-property","trigonometric"],None),

(25,"MATH","M09",1,7,
 r"The area in the first quadrant bounded by the ellipse $\dfrac{x^{2}}{16} + \dfrac{y^{2}}{9} = 1$, is",
 {"A":r"$2\pi$ sq. unit","B":r"$3\pi$ sq. unit","C":r"$4\pi$ sq. unit","D":r"$5\pi$ sq. unit"},
 ["B"],"easy",["area","ellipse","definite-integral"],None),

(26,"MATH","M10",1,8,
 r"The equation of the curve passing through $\left(\dfrac{\pi}{2}, 1\right)$ and having slope $\dfrac{\sin x}{x^{2}} - \dfrac{2y}{x}$ at each point $(x, y)$ with $x \neq 0$, is",
 {"A":r"$-x^{2}y + \cos x = -\dfrac{\pi^{2}}{4}$","B":r"$x^{2}y + \cos x = \dfrac{\pi^{2}}{4}$","C":r"$x^{2}y - \sin x = \dfrac{\pi^{2}}{4} - 1$","D":r"$x^{2}y + \sin x = \dfrac{\pi^{2}}{4} + 1$"},
 ["B"],"medium",["linear-ode","integrating-factor","initial-value"],None),

(27,"MATH","M10",1,8,
 r"The transformation $x = e^{t}$ reduces the differential equation $x^{2}\dfrac{d^{2}}{dx^{2}}y(x) - 2x\dfrac{d}{dx}y(x) + 2y(x) = x^{3}$ to $a\dfrac{d^{2}}{dt^{2}}y(t) + b\dfrac{d}{dt}y(t) + cy(t) = e^{3t}$, where $a, b, c$ are",
 {"A":r"$a = 1, b = -3, c = 2$","B":r"$a = -1, b = 3, c = -2$","C":r"$a = 1, b = 4, c = 3$","D":r"$a = -1, b = -3, c = -2$"},
 ["A"],"medium",["cauchy-euler","change-of-variable","second-order-ode"],None),

(28,"MATH","M10",1,8,
 r"The solution of the differential equation $\dfrac{dy}{dx} = -\dfrac{x}{y}$, where $y(4) = 3$ is",
 {"A":r"a circle","B":r"a straight line","C":r"an ellipse","D":r"a parabola"},
 ["A"],"easy",["variable-separable","initial-value","circle"],None),

(29,"MATH","M11",1,8,
 r"A fair coin is tossed twice. The probability of getting at least one head is",
 {"A":r"$\dfrac{1}{3}$","B":r"$\dfrac{1}{4}$","C":r"$\dfrac{3}{4}$","D":r"$1$"},
 ["C"],"easy",["classical-probability","complement","coin-toss"],None),

(30,"MATH","M11",1,8,
 r"If $P(A) = P(B) = \dfrac{1}{2}$ and $P(A^{c} \cap B^{c}) = \dfrac{1}{3}$, then the value of $P(A^{c} \cup B^{c})$ is",
 {"A":r"$\dfrac{1}{3}$","B":r"$\dfrac{2}{3}$","C":r"$1$","D":r"$\dfrac{3}{4}$"},
 ["B"],"easy",["de-morgan","addition-rule","complement"],None),

# ---------------- MATHEMATICS Cat-II (Q31-40) ----------------
(31,"MATH","M01",2,9,
 r"Consider two square matrices $A$ and $B$ such that $A^{2} = A$ and $A + B = I$, where $I$ is the identity matrix, then which of the following is/are true ? Where $\theta$ is the null matrix.",
 {"A":r"$B^{2} = B$","B":r"$AB = \theta$","C":r"$BA = \theta$","D":r"only (A) and (B) are correct but (C) is false."},
 ["A","B","C"],"medium",["idempotent-matrix","identity-matrix","matrix-algebra"],None),

(32,"MATH","M02",2,9,
 r"If the elements of a $3 \times 3$ matrix $A$ are polynomial of $x$ and if for $x = a$, three rows become identical then.",
 {"A":r"$(x - a)$ is a factor of $\det(A)$.","B":r"$(x - a)^{2}$ is a factor of $\det(A)$.","C":r"$(x - a)^{3}$ is a factor of $\det(A)$.","D":r"$(x - a)$ is not a factor of $\det(A)$."},
 ["A","B"],"hard",["determinant","factor-theorem","identical-rows"],None),

(33,"MATH","M03",2,9,
 r"Suppose $Z$ is a complex number and $\overline{Z}$ is the complex conjugate of $Z$. Then the values of $|Z|$ satisfying $iZ^{2} - \overline{Z} = 0$ are",
 {"A":r"$0$","B":r"$1$","C":r"$2$","D":r"$3$ or $4$"},
 ["A","B"],"medium",["complex-number","conjugate","modulus"],None),

(34,"MATH","M04",2,9,
 r"Which of the following is/are a rectangular hyperbola ?",
 {"A":r"$xy = c^{2}$","B":r"$\dfrac{x^{2}}{a^{2}} - \dfrac{y^{2}}{b^{2}} = 1$","C":r"$\dfrac{x^{2}}{b^{2}} - \dfrac{y^{2}}{a^{2}} = 1$","D":r"$x^{2} - y^{2} = c^{2}$"},
 ["A","D"],"easy",["rectangular-hyperbola","conic","asymptotes"],None),

(35,"MATH","M05",2,9,
 r"The value of $\left[\vec{a} \times \vec{b} \;\; \vec{b} \times \vec{c} \;\; \vec{c} \times \vec{a}\right]$ is",
 {"A":r"$2\left[\vec{a} \;\; \vec{b} \;\; \vec{c}\right]$","B":r"$2\left[\vec{a} \;\; \vec{b} \;\; \vec{c}\right]^{2}$","C":r"$\left[\vec{a} \;\; \vec{b} \;\; \vec{c}\right]^{2}$","D":r"$0$ if $\vec{a}, \vec{b}, \vec{c}$ are coplanar."},
 ["C","D"],"medium",["scalar-triple-product","cross-product","coplanar"],None),

(36,"MATH","M06",2,10,
 r"For the function $f : \mathbb{R} \longrightarrow \mathbb{R}$ defined by $f(x) = |x - 1| + |x - 2|$, which of the following is/are correct ?",
 {"A":r"$f(x)$ is continuous in $\mathbb{R}$.","B":r"$f(x)$ is continuous in $\mathbb{R}$ but not derivable in $\mathbb{R}$.","C":r"$f(x)$ is continuous in $\mathbb{R}$ but derivable in $\mathbb{R}$ except $x = 1$ and $2$.","D":r"$f(x)$ is not continuous at $x = 1$ and $2$ but derivable in $\mathbb{R}$."},
 ["A","C"],"medium",["continuity","differentiability","modulus-function"],None),

(37,"MATH","M07",2,10,
 r"For the function $f : \mathbb{R} \longrightarrow \mathbb{R}$, given by $f(x) = x^{3} - 6x^{2} + 24x + 4$, which of the following is correct ?",
 {"A":r"$f(x)$ attains only a maximum at $x = 2$.","B":r"$f(x)$ attains only a minimum at $x = -1$.","C":r"$f(x)$ attains both maximum and minimum at $x = -2$ and $x = -1$, respectively.","D":r"$f(x)$ has neither a maximum nor a minimum for any $x \in \mathbb{R}$."},
 ["D"],"medium",["maxima-minima","monotonic","discriminant"],None),

(38,"MATH","M09",2,10,
 r"$\displaystyle\int_{-\pi}^{\pi} (a\cos x + bx + cx^{2})\,dx$ depends on",
 {"A":r"only $a$","B":r"only $b$","C":r"only $c$","D":r"only $a, c$ not $b$"},
 ["C"],"easy",["definite-integral","odd-even","symmetric-limits"],None),

(39,"MATH","M10",2,10,
 r"The solution(s) of the differential equation $\dfrac{d^{2}y}{dx^{2}} + y = 0$ is (are)",
 {"A":r"$y = \sin x$","B":r"$y = \cos x$","C":r"$y = 2\cos x + 3\sin x$","D":r"$y = -\dfrac{7}{11}\sin x + \dfrac{9}{132}\cos x$"},
 ["A","B","C","D"],"easy",["second-order-ode","linear-combination","superposition"],None),

(40,"MATH","M11",2,10,
 r"If $A$ and $B$ are two independent events such that $P(A' \cap B) = \dfrac{2}{15}$ and $P(A \cap B') = \dfrac{1}{6}$, then $P(B)$ equal to",
 {"A":r"$\dfrac{1}{5}$","B":r"$\dfrac{1}{6}$","C":r"$\dfrac{4}{5}$","D":r"$\dfrac{5}{6}$"},
 ["B","C"],"medium",["independent-events","quadratic","probability"],None),

# ---------------- PHYSICS Cat-I (Q41-65) ----------------
(41,"PHYS","P01",1,11,
 "If velocity, time and force were chosen as basic quantities, then the dimension of mass will be",
 {"A":"$[FT^{2}V^{-2}]$","B":"$[FTV^{-1}]$","C":"$[F^{2}T^{-2}V^{2}]$","D":"$[FTV]$"},
 ["B"],"medium",["dimensions","dimensional-analysis"],None),

(42,"PHYS","P02",1,11,
 "A particle is thrown with initial speed $u$ at an angle $\\theta$ with the horizontal line. It follows a parabolic path as shown in the figure. Which of the following represents the speed-time graphs ($v_{x}$ and $v_{y}$ are the speed along $x$-axis and $y$-axis, respectively) ?",
 {"A":"$v_{x}$ constant, $v_{y}$ linearly varying","B":"$v_{x}$ linearly varying, $v_{y}$ constant","C":"both $v_{x}$ and $v_{y}$ constant","D":"both $v_{x}$ and $v_{y}$ linearly varying"},
 ["A"],"medium",["kinematics","projectile","graph"],"fig-2024-q42"),

(43,"PHYS","P13",1,11,
 "A beam of light moving through medium 1 is refracted in another medium 2 as shown in figure. If the wavelength of the light in medium 1 is $\\lambda_{1}$, and in medium 2 is $\\lambda_{2}$, then $\\dfrac{\\sin\\alpha_{2}}{\\sin\\alpha_{1}}$ equals",
 {"A":"$\\lambda_{2} = 2\\lambda_{1}$","B":"$\\dfrac{\\lambda_{2}}{\\lambda_{1}} = \\dfrac{\\sin\\alpha_{2}}{\\sin\\alpha_{1}}$","C":"$\\dfrac{\\cos\\alpha_{2}}{\\cos\\alpha_{1}}$","D":"$\\dfrac{\\lambda_{2}}{\\lambda_{1}} = \\dfrac{\\sin\\alpha_{2}}{\\sin\\alpha_{1}}$"},
 ["B"],"medium",["refraction","snells-law","wavelength"],"fig-2024-q43"),

(44,"PHYS","P06",1,12,
 "A load of $4\\,\\text{kg}$ is suspended from a ceiling through a steel wire of radius $2\\,\\text{mm}$. The tensile stress developed in the wire when equilibrium is achieved will be (Assume $g = 3.1\\pi\\,\\text{ms}^{-2}$)",
 {"A":"$3.1 \\times 10^{6}\\,\\text{Nm}^{-2}$","B":"$2.8 \\times 10^{4}\\,\\text{Nm}^{-2}$","C":"$6.8 \\times 10^{8}\\,\\text{Nm}^{-2}$","D":"$9.8 \\times 10^{3}\\,\\text{Nm}^{-2}$"},
 ["A"],"hard",["elasticity","stress","tensile"],None),

(45,"PHYS","P03",1,12,
 "A particle moves with constant speed $v$ along a circle of radius $R$. If the angular momentum of the particle about centre $C$ is $L_{C}$, and about a point $O$ is $L_{O}$, then $\\dfrac{L_{C}}{L_{O}}$",
 {"A":"$\\cos^{2}\\theta$","B":"$1 + \\cos\\theta$","C":"$\\cos^{2}\\theta$","D":"$\\dfrac{1}{\\cos^{2}\\theta}$"},
 ["B"],"hard",["angular-momentum","circular-motion","vector"],None),

(46,"PHYS","P02",1,12,
 "A particle starts moving from rest in a straight line with acceleration $a$. The maximum velocity attained by the particle during the motion is (acceleration varies as shown)",
 {"A":"$225\\,\\text{ms}^{-1}$","B":"$120\\,\\text{ms}^{-1}$","C":"$100\\,\\text{ms}^{-1}$","D":"$125\\,\\text{ms}^{-1}$"},
 ["D"],"medium",["kinematics","velocity","acceleration-graph"],"fig-2024-q46"),

(47,"PHYS","P04",1,12,
 "A drilling machine of power $P$ is used to drill a hole in a metal block of mass $M$ and specific heat $s\\,\\text{J kg}^{-1}\\,^{\\circ}\\text{C}^{-1}$. If $20\\%$ of the power is lost due to heating of the machine, the rise in temperature of the block (in $^{\\circ}\\text{C}$) in $t$ seconds will be",
 {"A":"$\\dfrac{0.8Pt}{Ms}$","B":"$\\dfrac{0.4Pt}{Ms}$","C":"$\\dfrac{0.2Pt}{Ms}$","D":"$\\dfrac{0.8P}{Mst}$"},
 ["B"],"medium",["work-power-energy","heat","power"],None),

(48,"PHYS","P09",1,13,
 "Suppose the same liquid is heated in two vessels $A$ and $B$ having coefficient of linear expansion $\\alpha_{A}$ and $\\alpha_{B}$ respectively. If coefficient of apparent expansion of the liquid in the two vessels are $\\gamma_{A}$ and $\\gamma_{B}$ and if $\\alpha_{A} > \\alpha_{B}$ then",
 {"A":"$\\gamma_{A} > \\gamma_{B}$","B":"$\\gamma_{A} < \\gamma_{B}$","C":"$\\gamma_{A} = \\gamma_{B}$","D":"None of these"},
 ["B"],"hard",["thermal-expansion","apparent-expansion"],None),

(49,"PHYS","P10",1,13,
 "A metal rod consists of two parts of equal cross-section $A$, but length of one is $l$ and that of the other is $2l$ and their thermal conductivities are respectively $k$ and $2k$, as shown in the figure. The temperatures at the two ends of the rod are $t_{1}$ and $t_{2}$ ($t_{1} > t_{2}$) as shown. What is the heat current at the steady state ?",
 {"A":"$\\dfrac{2kA(t_{1} - t_{2})}{3l}$","B":"$\\dfrac{2kA(t_{1} - t_{2})}{2l}$","C":"$\\dfrac{kA(t_{1} - t_{2})}{2l}$","D":"$\\dfrac{3kA(t_{1} - t_{2})}{2l}$"},
 ["W"],"voided",["thermal-conduction","steady-state","voided"],None),

(50,"PHYS","P14",1,13,
 "An eye specialist prescribed spectacles of power $+1.5\\,\\text{D}$ to a patient of hypermetropic eye. What is the near point of his defective eye ?",
 {"A":"$40\\,\\text{cm}$","B":"$30\\,\\text{cm}$","C":"$50\\,\\text{cm}$","D":"$15\\,\\text{cm}$"},
 ["A"],"medium",["lens","power","hypermetropia"],None),

(51,"PHYS","P10",1,13,
 "The thermal conductivity of a rod depends on",
 {"A":"length","B":"mass","C":"area of cross-section","D":"material of the rod"},
 ["D"],"easy",["thermal-conductivity","material"],None),

(52,"PHYS","P14",1,13,
 "An equiconvex lens of focal length $f$ is broken into four parts and then re-arranged as shown in the figure. After rearrangement, the equivalent focal length of the lens system is",
 {"A":"$\\dfrac{f}{2}$","B":"$\\dfrac{f}{4}$","C":"$f$","D":"$4f$"},
 ["A"],"hard",["lens","focal-length","rearrangement"],"fig-2024-q52"),

(53,"PHYS","P11",1,14,
 "The first law of thermodynamics is a statement of",
 {"A":"conservation of heat","B":"conservation of work","C":"conservation of momentum","D":"conservation of energy"},
 ["D"],"easy",["thermodynamics","first-law"],None),

(54,"PHYS","P03",1,14,
 "In the above figure all the strings are massless and the pulley is frictionless. Which of the following statement(s) is/are correct ?",
 {"A":"$T > T_{2} > T_{3}$","B":"$T < T_{2} < T_{3}$","C":"$T = T_{2} = T_{3}$","D":"$T_{2} > T_{1} = T_{3}$"},
 ["A"],"medium",["strings-pulley","tension","equilibrium"],"fig-2024-q54"),

(55,"PHYS","P15",1,14,
 "In an experiment on photoelectric effect the stopping potential $V_{0}$ is plotted against the frequency $(\\nu)$ of the light incident on a metal surface as shown in the figure. The work function of the surface of the metal is obtained from",
 {"A":"slope of the line $AC$.","B":"product of the slope of the line $AC$ and charge of the electron.","C":"product of the intercept $OA$ and the charge of the electron.","D":"intercept $OA$."},
 ["C"],"hard",["photoelectric","work-function","stopping-potential"],"fig-2024-q55"),

(56,"PHYS","P08",1,15,
 "A solid cylinder of height $H$, radius $R$ and density $\\rho$, floats vertically on the surface of a liquid of density $\\sigma$. The cylinder will be set into oscillatory motion by applying a small downward instantaneous force on it. The frequency of this small oscillation is",
 {"A":"$\\dfrac{1}{2\\pi}\\sqrt{\\dfrac{g\\sigma}{\\rho H}}$","B":"$\\dfrac{1}{2\\pi}\\sqrt{\\dfrac{g\\rho}{\\sigma H}}$","C":"$\\dfrac{1}{2\\pi}\\sqrt{\\dfrac{g\\sigma}{\\rho R}}$","D":"$\\dfrac{1}{2\\pi}\\sqrt{\\dfrac{g\\rho}{\\sigma R}}$"},
 ["A"],"hard",["oscillation","buoyancy","fluid"],None),

(57,"PHYS","P04",1,15,
 "The figure shows the variation of potential energy $V(x)$ of a particle with distance $x$. The particle has",
 {"A":"two equilibrium points, one stable and another unstable.","B":"two equilibrium points, both stable.","C":"three equilibrium points, one stable, two unstable.","D":"three equilibrium points, two stable, one unstable."},
 ["C"],"hard",["potential-energy","equilibrium","graph"],"fig-2024-q57"),

(58,"PHYS","P05",1,15,
 "The radius of the earth is approximately $6400\\,\\text{km}$. The height at which the acceleration due to gravity differs from $g$ (acceleration due to gravity at the Earth's surface) by approximately $2\\%$ is",
 {"A":"$62.5\\,\\text{km}$","B":"$63.9\\,\\text{km}$","C":"$64.2\\,\\text{km}$","D":"$65.3\\,\\text{km}$"},
 ["W"],"voided",["gravitation","variation-of-g","voided"],None),

(59,"PHYS","P05",1,15,
 "Two satellites $S_{1}$ and $S_{2}$ revolve round a planet in coplanar circular orbits in the same sense. Their periods of revolution are $1\\,\\text{h}$ and $8\\,\\text{h}$, respectively. The radius of the orbit of $S_{1}$ is $10^{4}\\,\\text{km}$. When $S_{2}$ is closest to $S_{1}$, then the angular speed of $S_{2}$ as observed by an astronaut in $S_{1}$ is",
 {"A":"$\\dfrac{\\pi}{2}\\,\\text{rad h}^{-1}$","B":"$\\pi\\,\\text{rad h}^{-1}$","C":"$\\dfrac{\\pi}{4}\\,\\text{rad h}^{-1}$","D":"$\\dfrac{\\pi}{3}\\,\\text{rad h}^{-1}$"},
 ["C"],"hard",["gravitation","satellite","relative-angular-speed"],None),

(60,"PHYS","P02",1,16,
 "A man standing on a road has to hold his umbrella at $30^{\\circ}$ with the vertical to keep the rain away. He throws the umbrella and starts running at $10\\,\\text{km/h}$. He finds that rain drops are hitting his head vertically. The speed of rain with respect to the ground $V_{rg}$ and with respect to the man $V_{rm}$ are respectively",
 {"A":"$V_{rg} = 20\\,\\text{km/h}, V_{rm} = 10\\sqrt{3}\\,\\text{km/h}$","B":"$V_{rg} = 10\\,\\text{km/h}, V_{rm} = 20\\,\\text{km/h}$","C":"$V_{rg} = 10\\sqrt{3}\\,\\text{km/h}, V_{rm} = 20\\sqrt{3}\\,\\text{km/h}$","D":"$V_{rg} = 10\\,\\text{km/h}, V_{rm} = 20\\sqrt{3}\\,\\text{km/h}$"},
 ["A"],"hard",["kinematics","relative-velocity","rain-umbrella"],None),

(61,"PHYS","P04",1,16,
 "A body of mass $m$ falls from a height $H$. The variations of its potential energy $(V)$ and kinetic energy $(K)$ as a function of time $(t)$ is",
 {"A":"$V$ decreases, $K$ increases, both bounded by $mgH$","B":"$V$ constant, $K$ increases","C":"$V$ increases, $K$ decreases","D":"$V$ and $K$ both constant"},
 ["A"],"medium",["energy","potential-kinetic","graph"],"fig-2024-q61"),

(62,"PHYS","P02",1,16,
 "A particle is moving in a $X$-$Y$ plane where $X$ and $Y$ coordinates are time dependent as follows: $X(t) = At^{4} + Bt$ and $Y(t) = Ct^{3} + D$ (Here $A = 1.00\\,\\text{m/s}^{4}$, $B = -2.00\\,\\text{m/s}$, $C = 2.00\\,\\text{m/s}^{3}$ and $D = 10\\,\\text{m}$). The position of the particle at $t = 2\\,\\text{sec}$ is",
 {"A":"$(10\\,\\text{m})\\hat{i} + (12\\,\\text{m})\\hat{j}$","B":"$(-5\\,\\text{m})\\hat{i} + (15\\,\\text{m})\\hat{j}$","C":"$(-10\\,\\text{m})\\hat{i} + (15\\,\\text{m})\\hat{j}$","D":"$(12\\,\\text{m})\\hat{i} + (26\\,\\text{m})\\hat{j}$"},
 ["D"],"medium",["kinematics","position-vector","polynomial"],None),

(63,"PHYS","P05",1,17,
 "A body of mass $m$ is lifted up from the earth surface to a height $R$. The potential energy of the body with respect to the earth surface is [Assume acceleration due to gravity on earth surface is $g_{0}$]",
 {"A":"$mg_{0}R$","B":"$\\dfrac{mg_{0}R}{2}$","C":"$-\\dfrac{mg_{0}R}{2}$","D":"$-mg_{0}R$"},
 ["B"],"medium",["gravitation","potential-energy","earth"],None),

(64,"PHYS","P03",1,17,
 "The mass of the bob of a simple pendulum (amplitude is small enough) is made doubled. Then the time period of the pendulum will be",
 {"A":"doubled","B":"four times of the original one","C":"half of the original one","D":"no change of time period"},
 ["D"],"easy",["simple-pendulum","time-period"],None),

(65,"PHYS","P04",1,17,
 "The dependence of the potential energy $(V)$ of a particle on its displacement $(x)$ is given in figure. The force $(F)$ acting on the particle is",
 {"A":"$F = -kx$","B":"$F = +kx$","C":"$F = -kx^{2}$","D":"$F = -kx + F_{0}$, where $F_{0}$ is a constant depending on $V_{0}$"},
 ["A"],"medium",["force","potential-energy","graph"],"fig-2024-q65"),

# ---------------- PHYSICS Cat-II (Q66-70) ----------------
(66,"PHYS","P02",2,17,
 "A particle of mass $m$ is moving along $x$-axis in a medium where the retarding force is proportional to its velocity. If the particle starts with an initial velocity $V_{0}$, then velocity $(V)$ versus displacement $(x)$ curve will look like",
 {"A":"$V$ decreases exponentially with $x$","B":"$V$ decreases linearly with $x$","C":"$V$ remains constant","D":"$V$ increases with $x$"},
 ["B"],"medium",["kinematics","retarding-force","velocity-displacement"],"fig-2024-q66"),

(67,"PHYS","P03",2,18,
 "A block of mass $1\\,\\text{kg}$ is held stationary against a rough vertical plate due to the acceleration $(a)$ of the plate, as shown in the figure. The coefficient of friction between block and plate will be",
 {"A":"$\\dfrac{g}{a}$","B":"$\\dfrac{a}{g}$","C":"$\\dfrac{a}{g}$","D":"$\\dfrac{g}{a}$"},
 ["B","C"],"medium",["friction","equilibrium","block-plate"],"fig-2024-q67"),

(68,"PHYS","P10",2,18,
 "Three rods $A, B, C$ made of the same material are joined as shown in the figure. Rods $A$ and $B$ have the same length and cross sectional area. Rod $C$ has length and cross sectional area both twice of those of rod $A$. The end of $A$ is kept at $0\\,^{\\circ}\\text{C}$ and those of $B$ and $C$ at $100\\,^{\\circ}\\text{C}$. Find the temperature at the junction of three rods.",
 {"A":"$66.67\\,^{\\circ}\\text{C}$","B":"$33.33\\,^{\\circ}\\text{C}$","C":"$50\\,^{\\circ}\\text{C}$","D":"$25\\,^{\\circ}\\text{C}$"},
 ["A"],"hard",["thermal-conduction","junction","rods"],"fig-2024-q68"),

(69,"PHYS","P07",2,18,
 "Eight small water drops of equal radii combine to form a big drop. The ratio of final surface energy to the total initial surface energy is",
 {"A":"$1 : 64$","B":"$1 : 8$","C":"$1 : 2$","D":"$1 : 4$"},
 ["C"],"medium",["surface-tension","surface-energy","drops"],None),

(70,"PHYS","P11",2,18,
 "$PV$ plots of adiabatic processes for two different gases are shown in the figure. Gas 1 and gas 2 will be",
 {"A":"He and $N_{2}$","B":"$N_{2}$ and He","C":"$CO_{2}$ and $O_{2}$","D":"$CO_{2}$ and Ar"},
 ["A"],"hard",["thermodynamics","adiabatic","gases"],"fig-2024-q70"),

# ---------------- CHEMISTRY Cat-I (Q71-85) ----------------
(71,"CHEM","C03",1,19,
 "The number of atoms in $52\\,\\text{gm}$ of $'He'$ are",
 {"A":"$78.299 \\times 10^{24}$","B":"$7.82 \\times 10^{23}$","C":"$7.829 \\times 10^{24}$","D":"$7.829 \\times 10^{22}$"},
 ["C"],"medium",["mole-concept","avogadro","atoms"],None),

(72,"CHEM","C01",1,19,
 "Which principle/rule decides the distribution of electrons in different shells ?",
 {"A":"Aufbau principle","B":"Pauli's exclusion principle","C":"Hund's rule","D":"All of these"},
 ["A"],"easy",["atomic-structure","aufbau","electronic-config"],None),

(73,"CHEM","C01",1,19,
 "Radius of 1st Bohr orbit of $H$ is $0.529\\,\\text{\\AA}$. The most probable radius (in $\\text{pm}$) for finding the electron in $He^{+}$ is",
 {"A":"$0.0265$","B":"$52.9$","C":"$26.5$","D":"$105.8$"},
 ["C"],"hard",["atomic-structure","bohr-radius","he-ion"],None),

(74,"CHEM","C02",1,19,
 "The edge length of NaCl crystal unit cell is $508\\,\\text{pm}$. If radius of $Na^{+}$ is $110\\,\\text{pm}$, the radius of $Cl^{-}$ is",
 {"A":"$288\\,\\text{pm}$","B":"$398\\,\\text{pm}$","C":"$144\\,\\text{pm}$","D":"$618\\,\\text{pm}$"},
 ["C"],"medium",["chemical-bonding","crystal","ionic-radius"],None),

(75,"CHEM","C04",1,19,
 "How many electrons are delivered at the cathode during electrolysis by a current of $1\\,\\text{A}$ in $10$ minutes ? (charge of electron $= 1.6 \\times 10^{-19}\\,\\text{C}$)",
 {"A":"$3.75 \\times 10^{21}$","B":"$3.75 \\times 10^{20}$","C":"$7.50 \\times 10^{21}$","D":"$6.0 \\times 10^{23}$"},
 ["A"],"medium",["electrochemistry","faraday","electrons"],None),

(76,"CHEM","C08",1,20,
 "Phenol is treated with Bromine water. Choose the correct statement.",
 {"A":"Ortho-bromophenol is produced as major product.","B":"Para-bromophenol is produced as major product.","C":"$2,4,6$-tribromophenol is precipitated and reaction requires $Fe/FeBr_{3}$ as catalyst.","D":"$2,4,6$-tribromophenol is precipitated and reaction does not require any catalyst."},
 ["D"],"medium",["organic","phenol","bromination"],None),

(77,"CHEM","C08",1,20,
 "Number of stereoisomers of $2,3$-dibromobutane is",
 {"A":"$2$","B":"$3$","C":"$4$","D":"$5$"},
 ["B"],"hard",["organic","stereoisomer","dibromobutane"],None),

(78,"CHEM","C08",1,20,
 "Chemical formula of carbolic acid is",
 {"A":"$\\text{OH}$","B":"$\\text{COOH}$","C":"$\\text{NO}_{2}$","D":"$\\text{C}_{6}\\text{H}_{5}\\text{OH}$"},
 ["D"],"easy",["organic","carbolic-acid","phenol"],None),

(79,"CHEM","C08",1,20,
 "Which of the following compounds will give white precipitate when treated with ammoniacal silver nitrate solution ?",
 {"A":"$\\text{HgCl}_{2}$","B":"$\\text{Hg}_{2}\\text{Cl}_{2}$","C":"$\\text{CH}_{3}\\text{COOH}$","D":"$\\text{HC}\\equiv\\text{C}-\\text{CH}=\\text{CH}-\\text{CH}_{3}$"},
 ["C"],"medium",["organic","tollens","alkyne"],None),

(80,"CHEM","C08",1,20,
 "In the reaction sequence: $\\text{CaC}_{2} + \\text{H}_{2}\\text{O} \\xrightarrow{} A \\xrightarrow{\\text{HgSO}_{4}} B \\xrightarrow{\\text{H}_{2}/\\text{Ni}} C \\xrightarrow{\\text{dil. H}_{2}\\text{SO}_{4}} C'$, '$C'$ is",
 {"A":"$\\text{HCHO}$","B":"$\\text{CH}_{3}\\text{CHO}$","C":"$\\text{CH}_{3}\\text{OH}$","D":"$\\text{C}_{2}\\text{H}_{5}\\text{OH}$"},
 ["D"],"hard",["organic","reaction-sequence","alcohol"],None),

(81,"CHEM","C03",1,20,
 "The solubility of $BaSO_{4}$ in water is $2.33 \\times 10^{-3}\\,\\text{gram/litre}$. Its solubility product will be (Mol. wt. of $BaSO_{4} = 233$)",
 {"A":"$5.43 \\times 10^{-6}$","B":"$1 \\times 10^{-10}$","C":"$1 \\times 10^{-5}$","D":"$1 \\times 10^{-20}$"},
 ["B"],"medium",["solubility-product","ksp","baSO4"],None),

(82,"CHEM","C01",1,20,
 "What is the hybridization of $S$ in $SF_{4}$ ?",
 {"A":"$sp^{3}$","B":"$sp^{3}d$","C":"$sp^{2}$","D":"$sp^{3}d^{2}$"},
 ["B"],"medium",["hybridization","sf4","vsepr"],None),

(83,"CHEM","C08",1,21,
 "Phenol is allowed to react with phthalic anhydride in presence of $H_{2}SO_{4}$ and finally the reaction mixture is made alkaline with $NaOH$. The product formed is",
 {"A":"Alizarin","B":"Methyl orange","C":"Fluorescein","D":"Phenolphthalein"},
 ["D"],"medium",["organic","phenolphthalein","indicator"],None),

(84,"CHEM","C02",1,21,
 "Which of the following molecules have one lone pair of electrons ?",
 {"A":"$SO_{2}$","B":"$XeF_{2}$","C":"$SiF_{4}$","D":"$H_{2}S$"},
 ["A"],"medium",["chemical-bonding","lone-pair","molecule"],None),

(85,"CHEM","C02",1,21,
 "Smallest internuclear distance is found in",
 {"A":"$O_{2}$","B":"$O_{2}^{+}$","C":"$O_{2}^{-}$","D":"$O_{2}^{2-}$"},
 ["B"],"hard",["chemical-bonding","bond-order","internuclear-distance"],None),

# ---------------- CHEMISTRY Cat-II (Q86-90) ----------------
(86,"CHEM","C03",2,21,
 "Correct statement(s) w.r.t. $H_{3}BO_{3}$ is/are",
 {"A":"It is a monobasic acid.","B":"It is a tribasic acid.","C":"It is a strong acid.","D":"It is a strong acid in presence of glycerol."},
 ["A","D"],"medium",["acids-bases","h3bo3","monobasic"],None),

(87,"CHEM","C02",2,21,
 "Which of the following species have linear geometry ?",
 {"A":"$\\text{NH}_{3}$","B":"$\\text{H}_{2}\\text{O}$","C":"$\\text{CO}_{2}$","D":"$\\text{BeCl}_{2}$"},
 ["B","C","D"],"medium",["chemical-bonding","linear-geometry","vsepr"],None),

(88,"CHEM","C08",2,21,
 "Which of the following compounds will liberate hydrogen gas, when reacted with sodium metal ?",
 {"A":"Dimethyl ether","B":"Methanol","C":"Propanoic acid","D":"Methyl propanoate"},
 ["B","C"],"medium",["organic","sodium","hydrogen-gas"],None),

(89,"CHEM","C08",2,21,
 "Which of the following compounds will give positive iodoform test ?",
 {"A":"$\\text{CH}_{3}\\text{OH}$","B":"$\\text{CH}_{3}\\text{COCH}_{3}$","C":"$\\text{CH}_{3}\\text{CH}_{2}\\text{OH}$","D":"$\\text{C}_{6}\\text{H}_{5}\\text{OCH}_{3}$"},
 ["C","D"],"medium",["organic","iodoform","ketone-alcohol"],None),

(90,"CHEM","C08",2,21,
 "An organic saturated alcohol is optically active. Its IUPAC nomenclature may be",
 {"A":"2-butanol","B":"2-methyl-2-butanol","C":"3-methyl-2-butanol","D":"3-pentanol"},
 ["A","C"],"hard",["organic","optical-activity","iupac"],None),

# ---------------- FEEE Cat-I (Q91-100) ----------------
(91,"FEEE","E01",1,22,
 "The cross-sectional area of the coil of a PMMC instrument with a spring constant of $0.28 \\times 10^{-6}\\,\\text{Nm/rad}$ is $7.2 \\times 10^{-4}\\,\\text{m}^{2}$. The air gap flux density is $3.6\\,\\text{mWb/m}^{2}$. The number of turns required to produce a deflection of $60^{\\circ}$ when a current of $10\\,\\text{mA}$ flows through the coil would be",
 {"A":"$136$","B":"$44$","C":"$22$","D":"$11$"},
 ["D"],"hard",["pmmc","instrument","turns"],None),

(92,"FEEE","E02",1,22,
 "The leakage flux in a transformer depends on",
 {"A":"applied voltage","B":"load current","C":"frequency","D":"mutual flux"},
 ["B"],"medium",["transformer","leakage-flux","load"],None),

(93,"FEEE","E03",1,22,
 "A single phase IM with identical main and auxiliary windings can be made self-starting by connecting",
 {"A":"a capacitor in series with the main winding.","B":"a capacitor in series with the auxiliary winding.","C":"a capacitor across the supply terminals.","D":"the main and auxiliary winding in series."},
 ["B"],"medium",["induction-motor","capacitor-start","self-starting"],None),

(94,"FEEE","E04",1,22,
 "Consider the following circuit: The node voltage $V_{1}$, $V_{2}$ and $E$ are respectively",
 {"A":"$V_{1} = -14\\,\\text{V}, V_{2} = 18\\,\\text{V}, E = -2\\,\\text{V}$","B":"$V_{1} = +14\\,\\text{V}, V_{2} = -2\\,\\text{V}, E = -2\\,\\text{V}$","C":"$V_{1} = +14\\,\\text{V}, V_{2} = 2\\,\\text{V}, E = 0\\,\\text{V}$","D":"$V_{1} = -14\\,\\text{V}, V_{2} = -2\\,\\text{V}, E = 0\\,\\text{V}$"},
 ["C"],"hard",["dc-circuit","node-voltage","kcl"],"fig-2024-q94"),

(95,"FEEE","E05",1,22,
 "The voltage $V = 5\\cos(40t + 60^{\\circ})$ is applied to a $0.5\\,\\text{H}$ inductor. The steady state current through the inductor is",
 {"A":"$i(t) = 4\\sin(40t + 60^{\\circ})\\,\\text{A}$","B":"$i(t) = 0.25\\cos(40t + 30^{\\circ})\\,\\text{A}$","C":"$i(t) = 0.25\\cos(40t - 30^{\\circ})\\,\\text{A}$","D":"$i(t) = 0.25\\cos(40t + 60^{\\circ})\\,\\text{A}$"},
 ["C"],"hard",["ac-circuit","inductor","phase"],None),

(96,"FEEE","E04",1,23,
 "Assuming that the diode in the given circuit is ideal, the voltage $V$ is",
 {"A":"$4\\,\\text{V}$","B":"$5\\,\\text{V}$","C":"$7.5\\,\\text{V}$","D":"$12.1\\,\\text{V}$"},
 ["B"],"medium",["diode","circuit","ideal-diode"],"fig-2024-q96"),

(97,"FEEE","E04",1,23,
 "In the circuit shown, the output voltage $V_{0}$ is",
 {"A":"$-9\\,\\text{V}$","B":"$-10\\,\\text{V}$","C":"$+10\\,\\text{V}$","D":"$+9\\,\\text{V}$"},
 ["B"],"hard",["circuit","output-voltage","transistor"],"fig-2024-q97"),

(98,"FEEE","E08",1,23,
 "For the logic circuit shown, the required input condition $(A, B, C)$ to make the output $X = 0$ is",
 {"A":"$1, 1, 1$","B":"$1, 0, 1$","C":"$0, 1, 1$","D":"$0, 0, 1$"},
 ["D"],"medium",["digital","logic-gate","output"],"fig-2024-q98"),

(99,"FEEE","E05",1,23,
 "The phase angle between $v_{1} = -10\\cos(\\omega t + 40^{\\circ})$ and $v_{2} = 8\\sin(\\omega t - 20^{\\circ})$ is",
 {"A":"$30^{\\circ}$","B":"$60^{\\circ}$","C":"$-60^{\\circ}$","D":"$20^{\\circ}$"},
 ["A"],"medium",["ac-circuit","phase-angle","phasor"],None),

(100,"FEEE","E03",1,23,
 "A DC motor develops a torque of $120\\,\\text{Nm}$ at $20\\,\\text{rps}$. At $30\\,\\text{rps}$, the torque developed by the motor is",
 {"A":"$160\\,\\text{Nm}$","B":"$120\\,\\text{Nm}$","C":"$80\\,\\text{Nm}$","D":"$40\\,\\text{Nm}$"},
 ["C"],"medium",["dc-motor","torque","speed"],None),
]
