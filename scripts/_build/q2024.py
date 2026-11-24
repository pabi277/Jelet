# JELET 2024 Paper-I Set A — question data, validated against WBJEEB Final Answer Key WBE/Ex-71 (01-08-2024).
# Q1–Q40 (Mathematics, PDF pages 3–10) and Q41–Q70 (Physics, PDF pages 11–18): verbatim visual transcription from the official Set A booklet. Q71–Q100: older OCR, pending Batch C.
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
 r"If velocity, time and force were chosen as basic quantities, then the dimension of mass will be",
 {"A":r"$FT^{2}V^{-2}$","B":r"$FTV^{-1}$","C":r"$F^{2}T^{-2}V^{2}$","D":r"$FTV$"},
 ["B"],"easy",["dimensions","dimensional-analysis","basic-quantities"],None),

(42,"PHYS","P02",1,11,
 r"A particle is thrown with initial speed $u$ at an angle $\theta$ with the horizontal line. It follows a parabolic path as shown in the figure. Which of the following represents the speed-time graphs [$v_{x}$ and $v_{y}$ are the speed along $x$-axis, and y-axis, respectively]",
 {"A":"Graph (A)","B":"Graph (B)","C":"Graph (C)","D":"Graph (D)"},
 ["A"],"easy",["projectile","speed-time-graph","components"],"fig-2024-q42"),

(43,"PHYS","P13",1,11,
 r"A beam of light moving through medium 1 is refracted in another medium 2 as shown in figure. If the wavelength of the light in medium 1 is $\lambda_{1}$ and in medium 2 is $\lambda_{2}$ then",
 {"A":r"$\lambda_{1} = \lambda_{2}$","B":r"$\lambda_{2} = \dfrac{\sin\alpha_{2}}{\sin\alpha_{1}}\lambda_{1}$","C":r"$\lambda_{2} = \dfrac{\sin\alpha_{1}}{\sin\alpha_{2}}\lambda_{1}$","D":r"$\lambda_{2} = \dfrac{\cos\alpha_{2}}{\cos\alpha_{1}}\lambda_{1}$"},
 ["B"],"easy",["refraction","snell-law","wavelength"],"fig-2024-q43"),

(44,"PHYS","P06",1,12,
 r"A load of $4\,\text{kg}$ is suspended from a ceiling through a steel wire of radius $2\,\text{mm}$. The tensile stress developed in the wire when equilibrium is achieved will be (Assume $g = 3.1\pi\,\text{ms}^{-2}$)",
 {"A":r"$3.1 \times 10^{6}\,\text{Nm}^{-2}$","B":r"$2.8 \times 10^{4}\,\text{Nm}^{-2}$","C":r"$6.8 \times 10^{8}\,\text{Nm}^{-2}$","D":r"$9.8 \times 10^{3}\,\text{Nm}^{-2}$"},
 ["A"],"easy",["stress","elasticity"],None),

(45,"PHYS","P03",1,12,
 r"A particle moves with constant speed $v$ along a circle of radius $R$. If the angular momentum of the particle about centre $C$ is $L_{c}$ and about point $O$ is $L_{o}$, then $\dfrac{L_{o}}{L_{c}}$ is",
 {"A":r"$\cos^{2}\theta$","B":r"$1 + \cos\theta$","C":r"$\cos^{2}\dfrac{\theta}{2}$","D":r"$1$"},
 ["B"],"medium",["angular-momentum","circular-motion","reference-point"],"fig-2024-q45"),

(46,"PHYS","P02",1,12,
 r"A particle starts moving from rest in a straight line with acceleration $a$. The variation of acceleration vs. time graph is given below in the figure. The maximum velocity attained by the particle during the motion is",
 {"A":r"$225\,\text{ms}^{-1}$","B":r"$120\,\text{ms}^{-1}$","C":r"$100\,\text{ms}^{-1}$","D":r"$125\,\text{ms}^{-1}$"},
 ["D"],"easy",["acceleration-time-graph","area-under-curve"],"fig-2024-q46"),

(47,"PHYS","P04",1,12,
 r"A drilling machine of power '$P$' is used to drill a hole in a metal block of mass '$M$' and specific heat '$s$' $\text{J kg}^{-1}\,^{\circ}\text{C}^{-1}$. If $20\%$ of the power is lost due to heating of the machine, the rise in temperature of the block (in $^{\circ}\text{C}$) in '$t$' seconds will be",
 {"A":r"$\dfrac{0.4\,Pt}{Ms}$","B":r"$\dfrac{0.8\,Pt}{Ms}$","C":r"$\dfrac{0.8\,P}{Ms\,t}$","D":r"$\dfrac{0.2\,Pt}{Ms}$"},
 ["B"],"easy",["power","heat","specific-heat"],None),

(48,"PHYS","P09",1,13,
 r"Suppose same liquid is heated in two vessels $A$ and $B$ having coefficient of linear expansion $\alpha_{A}$ and $\alpha_{B}$ respectively. If co-efficient of apparent expansion of liquid in two vessels are $\gamma_{A}^{a}$ and $\gamma_{B}^{a}$ and if $\alpha_{A} > \alpha_{B}$ then",
 {"A":r"$\gamma_{A}^{a} > \gamma_{B}^{a}$","B":r"$\gamma_{A}^{a} < \gamma_{B}^{a}$","C":r"$\gamma_{A}^{a} = \gamma_{B}^{a}$","D":"None of these"},
 ["B"],"easy",["apparent-expansion","thermal-expansion"],None),

(49,"PHYS","P10",1,13,
 r"A metal rod consists of two parts of equal cross-section $A$, but length of one is $l$ and that of the other is $2l$ and their thermal conductivities are respectively $k$ and $2k$, as shown in the figure. The temperatures at the two ends of the rod and $t_{1}$ and $t_{2}$ $(t_{1} > t_{2})$ as shown. What is the heat current at the steady state ?",
 {"A":r"$\dfrac{3kA(t_{2} - t_{1})}{2l}$","B":r"$\dfrac{2kA(t_{1} - t_{2})}{l}$","C":r"$\dfrac{kA}{l}(t_{1} - t_{2})$","D":r"$\dfrac{kA(t_{1} - t_{2})}{3l}$"},
 ["W"],"medium",["thermal-conduction","series-resistance","withdrawn"],"fig-2024-q49"),

(50,"PHYS","P14",1,13,
 r"An Eye specialist prescribed spectacles of power $+1.5\,\text{D}$ to a patient of hypermetropic eye. What is the near point of his defective eye ?",
 {"A":r"$40\,\text{cm}$","B":r"$30\,\text{cm}$","C":r"$50\,\text{cm}$","D":r"$15\,\text{cm}$"},
 ["A"],"easy",["hypermetropia","lens-power","near-point"],None),

(51,"PHYS","P10",1,13,
 r"The thermal conductivity of a rod depends on",
 {"A":"length","B":"mass","C":"area of cross-section","D":"material of the rod"},
 ["D"],"easy",["thermal-conductivity"],None),

(52,"PHYS","P14",1,13,
 r"An equiconvex lens of focal length $f$ is broken into four parts and then re-arranged as shown in the figure. After rearrangement, the equivalent focal length lens system is",
 {"A":r"$\dfrac{f}{2}$","B":r"$f$","C":r"$\dfrac{f}{4}$","D":r"$4f$"},
 ["A"],"medium",["lens-combination","plano-convex","lens-maker"],"fig-2024-q52"),

(53,"PHYS","P11",1,14,
 r"The first law of thermodynamics is a statement of",
 {"A":"conservation of heat","B":"conservation of work","C":"conservation of momentum","D":"conservation of energy"},
 ["D"],"easy",["first-law","thermodynamics"],None),

(54,"PHYS","P03",1,14,
 r"In the above figure all the strings are massless and pulley is frictionless. Which of the following statement(s) is/are correct ?",
 {"A":r"$T_{1} > T_{2} > T_{3}$","B":r"$T_{1} < T_{2} < T_{3}$","C":r"$T_{1} = T_{3} = T_{2}$","D":r"$T_{2} > T_{3} = T_{1}$"},
 ["A"],"easy",["tension","pulley","equilibrium"],"fig-2024-q54"),

(55,"PHYS","P15",1,14,
 r"In an experiment on photoelectric effect the stopping potential $V_{o}$ is plotted against the frequency $(\nu)$ of the light incident on a metal surface as shown in the figure. The work function of the surface of the metal is obtained from the",
 {"A":r"slope of the line $AC$.","B":r"product of the slope of the line $AC$ and charge of the electron.","C":r"product of the intercept $OA$ and the charge of the electron.","D":r"intercept $OA$."},
 ["C"],"easy",["photoelectric-effect","stopping-potential","work-function"],"fig-2024-q55"),

(56,"PHYS","P08",1,15,
 r"A solid cylinder of height $H$, radius $R$ and density $\rho$, floats vertically on the surface of a liquid of density $\sigma$. The cylinder will be set into oscillatory motion by applying a small downward instantaneous force on it. The frequency of this small oscillation is",
 {"A":r"$\omega = \sqrt{\dfrac{\sigma g}{\rho H}}$","B":r"$\omega = \sqrt{\dfrac{\rho g}{\sigma H}}$","C":r"$\omega = \sqrt{\dfrac{\sigma g}{\rho R}}$","D":r"$\omega = \sqrt{\dfrac{\rho g}{\sigma R}}$"},
 ["A"],"medium",["buoyancy","shm","floating-body"],None),

(57,"PHYS","P04",1,15,
 r"The figure shows the variation of potential energy $V(x)$ of a particle with distance $x$. The particle has",
 {"A":"Two equilibrium points, one stable and another unstable.","B":"Two equilibrium points, both stable.","C":"Three equilibrium points, one stable, two unstable.","D":"Three equilibrium points, two stable, one unstable."},
 ["C"],"easy",["potential-energy-curve","equilibrium","stability"],"fig-2024-q57"),

(58,"PHYS","P05",1,15,
 r"The radius of the earth is approximately $6400\,\text{km}$. The height at which the acceleration due to gravity differs from $g$(acceleration due to gravity at the Earth's surface) by approximately $2\%$ is",
 {"A":r"$62.5\,\text{km}$","B":r"$63.9\,\text{km}$","C":r"$64.2\,\text{km}$","D":r"$65.3\,\text{km}$"},
 ["W"],"medium",["gravity-with-height","withdrawn"],None),

(59,"PHYS","P05",1,15,
 r"Two satellites $S_{1}$ and $S_{2}$ revolve round a planet in coplanar circular orbits in the same sense. Their periods of revolution are $1\,\text{h}$ and $8\,\text{h}$, respectively. The radius of the orbit of $S_{1}$ is $10^{4}\,\text{km}$. When $S_{2}$ is closest to $S_{1}$ then the angular speed of $S_{2}$ as observed by an astronaut in $S_{1}$ is",
 {"A":r"$\dfrac{\pi}{2}\,\text{rad/h}$","B":r"$\dfrac{\pi}{4}\,\text{rad h}^{-1}$","C":r"$\dfrac{\pi}{3}\,\text{rad h}^{-1}$","D":r"$\pi\,\text{rad h}^{-1}$"},
 ["C"],"hard",["kepler-third-law","relative-angular-velocity","satellites"],None),

(60,"PHYS","P02",1,16,
 r"A man standing on a road has to hold his umbrella at $30^{\circ}$ with the vertical to keep the rain away. He throws the umbrella and starts running at $10\,\text{km/h}$. He finds that rain drops are hitting his head vertically. The speed of rain drops with respect to the road $(V_{rg})$ and the moving man $(V_{rm})$ are respectively.",
 {"A":r"$V_{rg} = 20\,\text{km/h}$, $V_{rm} = 10\sqrt{3}\,\text{km/h}$","B":r"$V_{rg} = 10\,\text{km/h}$, $V_{rm} = 20\,\text{km/h}$","C":r"$V_{rg} = 10\sqrt{3}\,\text{km/h}$, $V_{rm} = 20\sqrt{3}\,\text{km/h}$","D":r"$V_{rg} = 10\,\text{km/h}$, $V_{rm} = 20\sqrt{3}\,\text{km/h}$"},
 ["A"],"medium",["relative-velocity","rain-umbrella"],None),

(61,"PHYS","P04",1,16,
 r"A particle of mass $m$ is falling freely under gravity from height $H$ from rest. The variations of its potential energy $(V)$ and kinetic energy $(K)$ as a function of time $(t)$ is",
 {"A":"Graph (A)","B":"Graph (B)","C":"Graph (C)","D":"Graph (D)"},
 ["A"],"medium",["free-fall","energy-time-graph","conservation-of-energy"],None),

(62,"PHYS","P02",1,16,
 r"A particle is moving in a X-Y plane where X and Y coordinates are time dependent as follows : $X(t) = At^{4} + Bt$ and $Y(t) = Ct^{3} + D$ (Here $A = 1.00\,\text{m/s}^{4}$, $B = -2.00\,\text{m/s}$, $C = 2.00\,\text{m/s}^{3}$ and $D = 10\,\text{m}$). The position of the particle at $t = 2$ sec is",
 {"A":r"$(10\,\text{m})\hat{i} + (12\,\text{m})\hat{j}$","B":r"$(-5\,\text{m})\hat{i} + 15\,\text{m}\hat{j}$","C":r"$(-10\,\text{m})\hat{i} + (15\,\text{m})\hat{j}$","D":r"$(12\,\text{m})\hat{i} + (26\,\text{m})\hat{j}$"},
 ["D"],"easy",["position-vector","kinematics-2d"],None),

(63,"PHYS","P05",1,17,
 r"A body of mass $m$ is lifted up from the earth surface to a height $R$. The potential energy of the body with respect to the earth surface is [Assume acceleration due to gravity on earth surface is $g_{o}$]",
 {"A":r"$mg_{o}R$","B":r"$\dfrac{mg_{o}R}{2}$","C":r"$-\dfrac{mg_{o}R}{2}$","D":r"$-mg_{o}R$"},
 ["B"],"medium",["gravitational-potential-energy","height-equal-radius"],None),

(64,"PHYS","P03",1,17,
 r"The mass of the bob of a simple pendulum (amplitude is small enough) is made doubled. Then the time period of the pendulum will be",
 {"A":"Doubled","B":"Four times of the original one","C":"half of the original one","D":"no change of time period"},
 ["D"],"easy",["simple-pendulum","time-period"],None),

(65,"PHYS","P04",1,17,
 r"The dependence of the potential energy $(V)$ of a particle on its displacement $(x)$ is given in figure. The force $(F)$ acting on the particle is ($k$ is a constant)",
 {"A":r"$F = -kx$","B":r"$F = +kx$","C":r"$F = -kx^{2}$","D":r"$F = -kx + F_{o}$, where $F_{o}$ is a constant depending on $V_{o}$."},
 ["A"],"easy",["potential-energy","force-from-potential","parabolic-well"],"fig-2024-q65"),

# ---------------- PHYSICS Cat-II (Q66-70) ----------------
(66,"PHYS","P02",2,17,
 r"A particle of mass $m$ is moving along $x$-axis in a medium where the retarding force is proportional to its velocity. If the particle starts with an initial velocity $V_{o}$, then velocity $(V)$ versus displacement $(x)$ curve will look like",
 {"A":"Graph (A)","B":"Graph (B)","C":"Graph (C)","D":"Graph (D)"},
 ["B"],"medium",["viscous-drag","velocity-displacement","linear-retardation"],None),

(67,"PHYS","P03",2,18,
 r"A block of mass $1\,\text{kg}$ is held stationary against a rough vertical plate due to the acceleration $(\vec{a})$ of the plate, as shown in the figure. The coefficient of friction between block and plate will be",
 {"A":r"$< \dfrac{g}{a}$","B":r"$> \dfrac{g}{a}$","C":r"$= \dfrac{g}{a}$","D":r"$= \dfrac{a}{g}$"},
 ["B","C"],"medium",["friction","pseudo-force","non-inertial-frame"],"fig-2024-q67"),

(68,"PHYS","P10",2,18,
 r"Three rods $A$, $B$, $C$ made of the same material are joined as shown in the figure. Rods $A$ and $B$ have the same length and cross sectional area. Rod $C$ has length and cross sectional area both twice of those of rod $A$. The end of $A$ is kept at $0\,^{\circ}\text{C}$ and those of $B$ and $C$ at $100\,^{\circ}\text{C}$. Find the temperature at the junction of three rods.",
 {"A":r"$66.67\,^{\circ}\text{C}$","B":r"$33.33\,^{\circ}\text{C}$","C":r"$50\,^{\circ}\text{C}$","D":r"$25\,^{\circ}\text{C}$"},
 ["A"],"medium",["thermal-conduction","junction-temperature","thermal-resistance"],"fig-2024-q68"),

(69,"PHYS","P07",2,18,
 r"Eight small water drops of equal radii combine to form a big drop. The ratio of final surface energy to the total initial surface energy is",
 {"A":r"$1 : 64$","B":r"$1 : 8$","C":r"$1 : 2$","D":r"$1 : 4$"},
 ["C"],"easy",["surface-energy","drops-coalescence"],None),

(70,"PHYS","P11",2,18,
 r"$PV$ plots of adiabatic processes for two different gases are shown in the figure. Gas 1 and gas 2 will be",
 {"A":r"He and $\text{N}_{2}$","B":r"$\text{N}_{2}$ and He","C":r"$\text{CO}_{2}$ and $\text{O}_{2}$","D":r"$\text{CO}_{2}$ and Ar"},
 ["A"],"medium",["adiabatic-process","gamma","pv-diagram"],"fig-2024-q70"),

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

# OPTION_FIGURES_2024[qNumber][optionId] = (figureKey, alt) — faithful redraws of the booklet option graphs.
OPTION_FIGURES_2024 = {
    42: {
        "A": ("fig-2024-q42-optA", "Graph (A): left, v_x versus t is a horizontal line (constant); right, v_y versus t falls linearly to zero and then rises linearly (V shape)"),
        "B": ("fig-2024-q42-optB", "Graph (B): left, v_x versus t falls linearly to zero and then rises linearly (V shape); right, v_y versus t is a horizontal line"),
        "C": ("fig-2024-q42-optC", "Graph (C): left, v_x versus t is a horizontal line; right, v_y versus t rises linearly from zero to a peak and falls linearly back to zero (triangle)"),
        "D": ("fig-2024-q42-optD", "Graph (D): left, v_x versus t rises linearly from zero to a peak and falls back to zero (triangle); right, v_y versus t is a horizontal line"),
    },
    61: {
        "A": ("fig-2024-q61-optA", "Graph (A): V falls from mgH along a curve that is flat at t = 0 and steepens (concave down) to zero at t = sqrt(2h/g); K rises from zero along a curve that is flat at t = 0 and steepens (concave up) to mgH; dashed lines mark mgH and t = sqrt(2h/g)"),
        "B": ("fig-2024-q61-optB", "Graph (B): V falls from mgH along a concave-down curve to zero at t = sqrt(2h/g); K rises steeply from zero and flattens (concave down) to mgH; dashed lines mark mgH and t = sqrt(2h/g)"),
        "C": ("fig-2024-q61-optC", "Graph (C): V falls steeply from mgH and flattens (concave up) to zero at t = sqrt(2h/g); K rises from zero along a concave-up curve to mgH; dashed lines mark mgH and t = sqrt(2h/g)"),
        "D": ("fig-2024-q61-optD", "Graph (D): V falls from mgH along a concave-down curve and K rises along a concave-up curve, both reaching their end values at t = sqrt(h/g); dashed lines mark mgH and t = sqrt(h/g)"),
    },
    66: {
        "A": ("fig-2024-q66-optA", "Graph (A): V versus x; V starts at V_o and decreases along a curve that flattens out, approaching the x-axis without reaching it"),
        "B": ("fig-2024-q66-optB", "Graph (B): V versus x; V decreases along a straight line from V_o to zero at a finite x"),
        "C": ("fig-2024-q66-optC", "Graph (C): V versus x; V falls very steeply from V_o and then flattens along the x-axis"),
        "D": ("fig-2024-q66-optD", "Graph (D): V versus x; V falls from V_o, crosses the x-axis, dips below it and then oscillates about the axis with decreasing amplitude"),
    },
}
STEM_FIGURE_ALT_2024 = {
    42: "Projectile: axes x and y; a velocity arrow u from the origin at angle θ above the x-axis, and the parabolic path rising from the origin and returning to the x-axis",
    43: "Refraction: a vertical normal and a horizontal interface; medium 1 below and medium 2 above. The incident ray comes up from the lower left making angle α1 with the normal; the refracted ray leaves to the upper right making a larger angle α2 with the normal",
    45: "Circle with centre C on a dashed horizontal diameter; O is the left end of that diameter on the circle; a radius from C to the particle makes angle θ with the diameter, and the velocity v is tangent at the particle",
    46: "Acceleration a (ms⁻²) versus t (s): a straight line falling from a = 10 at t = 0 to a = 0 at t = 25",
    49: "Composite rod: two equal-section parts in series, the left of length l and conductivity k, the right of length 2l and conductivity 2k; end temperatures t1 on the left and t2 on the right",
    52: "Left: an equiconvex lens cut by a vertical and a horizontal line into quarters A, B (top) and C, D (bottom). An arrow labelled Rearrangement points to four quarter pieces A, B, C, D standing side by side on a horizontal line, each with its flat cut face vertical and its curved face to the left",
    54: "A fixed frictionless pulley hung from a ceiling. Left string (tension T1) holds a 5 kg block, below which a string of tension T2 holds a 10 kg block. Right string (tension T1) holds a 10 kg block, below which a string of tension T3 holds a 5 kg block",
    55: "Stopping potential V_o versus frequency ν: a straight line starting at A on the negative V_o axis below the origin O, crossing the ν-axis at B and rising to C",
    57: "Potential energy V(x) versus x: the curve rises to a high maximum, falls to a minimum, rises to a lower maximum and falls again",
    65: "Potential energy V versus x: a parabola opening upwards, symmetric about the V-axis, with its lowest point V_o on the V-axis above the x-axis",
    67: "A vertical rectangular plate drawn in perspective, with a 1 kg cube against its face; an arrow a on the left shows the acceleration of the plate, perpendicular to its face",
    68: "Y-shaped junction of three rods: rod B goes to the upper left with its end at 100 °C, rod A to the lower left with its end at 0 °C, and the wider rod C runs horizontally to the right with its end at 100 °C",
    70: "P–V diagram: two adiabatic curves starting from the same point; the gas 1 curve falls more steeply and ends lower, and the gas 2 curve falls less steeply",
}
