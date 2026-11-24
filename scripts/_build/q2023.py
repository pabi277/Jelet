# JELET 2023 Paper-I Set A — question data, validated against WBJEEB Final Answer Key JEEB/Reg-267/23 (03-08-2023).
# Q1–Q40 (Mathematics, PDF pages 3–9): verbatim visual transcription from the official Set A booklet. Q41–Q100: older OCR, pending Batches B and C.
# Each entry: (qNumber, subjectId, unitId, category, pdfPage, stemLatex, {A,B,C,D: latex}, correct(list), difficulty, tags, figureKeyOrNone)

Q2023 = [
# ---------------- MATHEMATICS Cat-I (Q1-30) ----------------
# Q1–Q40: verbatim visual transcription from 180-DPI renders of the official Set A booklet
# (PDF pages 3–9, read with read_file before editing). Raw strings keep LaTeX backslashes intact.
# Key: JEEB/Reg-267/23 (03-08-2023), Series-A column. Q6 is withdrawn (W).
(1,"MATH","M01",1,3,
 r"If $A = \begin{pmatrix} x & y \\ y & x \end{pmatrix}$ and $A^{2} = \begin{pmatrix} \alpha & \beta \\ \beta & \alpha \end{pmatrix}$, where $\beta = \dfrac{1}{2}Kxy$, then the value of $K$ is",
 {"A":r"$\dfrac{1}{2}$","B":r"$1$","C":r"$2$","D":r"$4$"},
 ["D"],"easy",["matrix-product","symmetric-matrix","matrix-power"],None),

(2,"MATH","M01",1,3,
 r"Let $P = \begin{pmatrix} \dfrac{\sqrt{3}}{2} & \dfrac{1}{2} \\ -\dfrac{1}{2} & \dfrac{\sqrt{3}}{2} \end{pmatrix}$ and $Q = PAP^{T}$ (where $A$ is any $2 \times 2$ matrix). Then $P^{T}Q^{99}P$ is",
 {"A":r"$P^{99}$","B":r"$(P^{T})^{99}$","C":r"$A$","D":r"$A^{99}$"},
 ["D"],"medium",["orthogonal-matrix","matrix-power","similarity"],None),

(3,"MATH","M01",1,3,
 r"If the rank of the matrix $\begin{pmatrix} -1 & 2 & 5 \\ 2 & -4 & a-4 \\ 1 & -2 & a+1 \end{pmatrix}$ is $1$, then the value of $a$ is",
 {"A":r"$-1$","B":r"$-2$","C":r"$-6$","D":r"$4$"},
 ["C"],"easy",["rank","proportional-rows","matrix"],None),

(4,"MATH","M02",1,3,
 r"In a Geometric Progression, $p^{\text{th}}$, $q^{\text{th}}$ and $r^{\text{th}}$ elements are $x$, $y$ and $z$ respectively. Then which of the following is correct for the matrix $A = \begin{bmatrix} \log x & p & 1 \\ \log y & q & 1 \\ \log z & r & 1 \end{bmatrix}$, where $x$, $y$ and $z$ are positive",
 {"A":r"Singular matrix","B":r"Orthogonal matrix","C":r"$|A| = r\log y$","D":r"$|A| = q\log z$"},
 ["A"],"medium",["determinant","geometric-progression","column-operations"],None),

(5,"MATH","M04",1,3,
 r"If $(a_{1}, b_{1})$, $(a_{2}, b_{2})$ and $(a_{1} - a_{2}, b_{1} - b_{2})$ are three collinear points, then which of the following is true ?",
 {"A":r"$a_{1}b_{2} = b_{1}a_{2}$","B":r"$a_{1}a_{2} = b_{1}b_{2}$","C":r"$a_{1}b_{2} + b_{1}a_{2} = 0$","D":r"$a_{1}b_{1} = a_{2}b_{2}$"},
 ["A"],"easy",["collinearity","area-of-triangle","determinant"],None),

(6,"MATH","M02",1,4,
 r"The system of equations $x + y + z = 1$, $2x + 3y - z = 5$, $x + y - kz = 4$ where $k \in \mathbb{R}$, has an infinite number of solutions when $k =$",
 {"A":r"$0$","B":r"$3$","C":r"$2$","D":r"$-2$"},
 ["W"],"medium",["linear-system","consistency","withdrawn"],None),

(7,"MATH","M03",1,4,
 r"If $f_{r}(\alpha) = \left(\cos\dfrac{\alpha}{r^{2}} + i\sin\dfrac{\alpha}{r^{2}}\right) \times \left(\cos\dfrac{2\alpha}{r^{2}} + i\sin\dfrac{2\alpha}{r^{2}}\right) \times \cdots\cdots \times \left(\cos\dfrac{\alpha}{r} + i\sin\dfrac{\alpha}{r}\right)$, then $\lim\limits_{n \to \infty} f_{n}(\pi)$ equals",
 {"A":r"$i$","B":r"$-i$","C":r"$1$","D":r"$\infty$"},
 ["A"],"medium",["de-moivre","product-of-cis","limit"],None),

(8,"MATH","M03",1,4,
 r"If $a$, $b$, $c$ are the roots of $y^{3} - 3y^{2} + 3y + 26 = 0$ and $\omega$ is a cube root of unity, then the value of $\dfrac{a-1}{b-1} + \dfrac{b-1}{c-1} + \dfrac{c-1}{a-1}$ is",
 {"A":r"$0$","B":r"$3$","C":r"$3\omega$","D":r"$3\omega^{2}$"},
 ["D"],"medium",["cube-roots-of-unity","cubic-equation","substitution"],None),

(9,"MATH","M04",1,4,
 r"If a line joining two points $A\,(2, 0)$ and $B\,(3, 1)$ is rotated about $A$ in anticlockwise direction through an angle $15^{\circ}$, then the equation of the line in the new position is",
 {"A":r"$\sqrt{3}x - y = \sqrt{3}$","B":r"$\sqrt{3}x + y = 2\sqrt{3}$","C":r"$x + y\sqrt{3} = 2\sqrt{3}$","D":r"$\sqrt{3}x - y = 2\sqrt{3}$"},
 ["D"],"easy",["straight-line","rotation","slope"],None),

(10,"MATH","M04",1,4,
 r"The length of the chord intercepted by the parabola $y^{2} = 8x$ on the straight line $2x - y - 3 = 0$ is",
 {"A":r"$4$ units","B":r"$5$ units","C":r"$4\sqrt{5}$ units","D":r"$4\sqrt{3}$ units"},
 ["C"],"easy",["parabola","chord-length","intersection"],None),

(11,"MATH","M04",1,4,
 r"A conic section is defined by the equation $x = -1 + \sec t$, $y = 2 + 3\tan t$. The coordinates of the foci are",
 {"A":r"$(1 \pm \sqrt{10}, 2)$","B":r"$(-1 \pm \sqrt{10}, 2)$","C":r"$(-1 \pm \sqrt{8}, 2)$","D":r"$(1 \pm \sqrt{8}, -2)$"},
 ["B"],"medium",["hyperbola","parametric-form","foci"],None),

(12,"MATH","M05",1,5,
 r"If $\vec{a}$ and $\vec{b}$ are two-unit vectors, then the vector $(\vec{a} + \vec{b}) \times (\vec{a} \times \vec{b})$ is parallel to the vector",
 {"A":r"$\vec{a} + \vec{b}$","B":r"$\vec{a} - \vec{b}$","C":r"$2\vec{a} + 3\vec{b}$","D":r"$2\vec{a} - 3\vec{b}$"},
 ["B"],"medium",["vector-triple-product","unit-vectors","parallel"],None),

(13,"MATH","M05",1,5,
 r"A unit tangent vector at $t = 2$ on the curve $x = t^{2} + 2$, $y = 4t - 5$, $z = 2t^{2} - 6t$ is",
 {"A":r"$\dfrac{1}{\sqrt{3}}(2\hat{i} + 2\hat{j} + \hat{k})$","B":r"$\dfrac{1}{3}(2\hat{i} + \hat{j} + 2\hat{k})$","C":r"$\dfrac{1}{3}(\hat{i} + 2\hat{j} + 2\hat{k})$","D":r"$\dfrac{1}{3}(2\hat{i} + 2\hat{j} + \hat{k})$"},
 ["D"],"easy",["tangent-vector","space-curve","unit-vector"],None),

(14,"MATH","M06",1,5,
 r"$\lim\limits_{x \to 0} \dfrac{\sin(\pi\cos^{2}x)}{x^{2}} =$",
 {"A":r"$0$","B":r"$1$","C":r"$\pi$","D":r"$-\pi$"},
 ["C"],"medium",["limit","standard-limit","trig-identity"],None),

(15,"MATH","M06",1,5,
 r"If the function $f(x) = \begin{cases} \dfrac{x^{2} - (A+2)x + A}{x - 2} & \text{for } x \neq 2 \\ 2 & \text{for } x = 2 \end{cases}$ is continuous at $x = 2$, then",
 {"A":r"$A = 0$","B":r"$A = 1$","C":r"$A = -1$","D":r"$A = 2$"},
 ["A"],"easy",["continuity","removable-discontinuity","limit"],None),

(16,"MATH","M06",1,5,
 r"Suppose that $f$ is a differentiable function with the property that $f(x + y) = f(x) + f(y) + xy$, $f(0) = 0$ and $\lim\limits_{h \to 0} \dfrac{1}{h}f(h) = 3$, then $f(x)$ is",
 {"A":r"$x + \dfrac{x^{2}}{2}$","B":r"$3x + \dfrac{x^{2}}{2}$","C":r"$3x + x^{2}$","D":r"$3x + 2x^{2}$"},
 ["B"],"medium",["functional-equation","derivative-from-first-principles"],None),

(17,"MATH","M06",1,5,
 r"If $f(a) = a^{2}$, $\phi(a) = b^{2}$ and $f'(a) = 3\phi'(a)$, then $\lim\limits_{x \to a} \dfrac{\sqrt{f(x)} - a}{\sqrt{\phi(x)} - b}$ is",
 {"A":r"$\dfrac{3b^{2}}{a^{2}}$","B":r"$\dfrac{b}{3a}$","C":r"$\dfrac{3b(b+1)}{a(a+1)}$","D":r"$\dfrac{3b}{a}$"},
 ["D"],"medium",["lhospital","chain-rule","limit"],None),

(18,"MATH","M06",1,6,
 r"The function $f(x) = x(x + 3)e^{-\left(\frac{1}{2}\right)x}$ satisfies the condition of Rolle's theorem in $[-3, 0]$. The value of $c$, where $f'(c) = 0$, is",
 {"A":r"$-3$","B":r"$0$","C":r"$-2$","D":r"$-1$"},
 ["C"],"easy",["rolles-theorem","product-rule","critical-point"],None),

(19,"MATH","M07",1,6,
 r"The slope of the tangent to the curve represented by $x = t^{2} + 3t - 8$ and $y = 2t^{2} - 2t - 5$ at the point $M\,(2, -1)$ is",
 {"A":r"$\dfrac{6}{7}$","B":r"$\dfrac{7}{6}$","C":r"$\dfrac{3}{2}$","D":r"$\dfrac{2}{3}$"},
 ["A"],"easy",["parametric-derivative","tangent-slope"],None),

(20,"MATH","M07",1,6,
 r"The tangent to the curve $x = a\sqrt{\cos 2\theta}\,\cos\theta$, $y = a\sqrt{\cos 2\theta}\,\sin\theta$ at the point, corresponding to $\theta = \dfrac{\pi}{6}$ is",
 {"A":r"parallel to $x$ axis","B":r"parallel to $y$ axis","C":r"parallel to the line $y = x$","D":r"parallel to the line $y = 3x$"},
 ["A"],"medium",["parametric-derivative","tangent","lemniscate"],None),

(21,"MATH","M07",1,6,
 r"If $f(x) = x^{2} + 2bx + 2c^{2}$ and $g(x) = -x^{2} - 2cx + b^{2}$ are such that $\min f(x) > \max g(x)$, then the relation between $b$ and $c$ is",
 {"A":r"$|b| > |c|\sqrt{2}$","B":r"$|c| > |b|\sqrt{2}$","C":r"$|b| < |c|\sqrt{2}$","D":r"$|c| < |b|\sqrt{2}$"},
 ["B"],"medium",["maxima-minima","quadratic","completing-square"],None),

(22,"MATH","M08",1,6,
 r"If the function $u = \log\left(\dfrac{x^{3} + x^{2}y - y^{3}}{x - y}\right)$, then $x\dfrac{\partial u}{\partial x} + y\dfrac{\partial u}{\partial y}$ is",
 {"A":r"$1$","B":r"$0$","C":r"$2$","D":r"$4$"},
 ["C"],"easy",["euler-theorem","homogeneous-function","partial-derivative"],None),

(23,"MATH","M08",1,6,
 r"Let $f(x, y) = \dfrac{ax^{2} + by^{2}}{xy}$, where $a$ and $b$ are constants. If $\dfrac{\partial f}{\partial x} = \dfrac{\partial f}{\partial y}$ at $x = 1$ and $y = -2$, then the relation between $a$ and $b$ is",
 {"A":r"$a = 4b$","B":r"$8a = b$","C":r"$12a = b$","D":r"$a = 20b$"},
 ["A"],"easy",["partial-derivative","evaluation"],None),

(24,"MATH","M09",1,6,
 r"If $k = e^{2007}$, the value of $I = \displaystyle\int_{1}^{k} \dfrac{\pi\cos(\pi\log x)}{x}\,dx$ is",
 {"A":r"$0$","B":r"$e$","C":r"$2007\pi$","D":r"$\pi$"},
 ["A"],"easy",["definite-integral","substitution","logarithm"],None),

(25,"MATH","M09",1,7,
 r"Let $f(x)$, $g(x)$ and $h(x)$ be continuous functions on $[0, a]$ such that $f(x) = f(a - x)$, $g(x) = -g(a - x)$ and $3h(x) - 4h(a - x) = 5$. Then $\displaystyle\int_{0}^{a} f(x)\,g(x)\,h(x)\,dx$ is",
 {"A":r"$a$","B":r"$-a$","C":r"$1$","D":r"$0$"},
 ["D"],"medium",["definite-integral","king-property","symmetry"],None),

(26,"MATH","M09",1,7,
 r"The area of the region bounded by the curves $y = x^{2}$ and $x = y^{2}$ is",
 {"A":r"$1$ sq. unit","B":r"$\dfrac{1}{2}$ sq. unit","C":r"$\dfrac{1}{3}$ sq. unit","D":r"$\dfrac{2}{3}$ sq. unit"},
 ["C"],"easy",["area-between-curves","parabolas"],None),

(27,"MATH","M10",1,7,
 r"The solution of the differential equation $y' = \dfrac{y}{x} + \dfrac{\phi(y/x)}{\phi'(y/x)}$ is (where $c$ is any arbitrary constant.)",
 {"A":r"$x\phi(y/x) = xc$","B":r"$\phi(y/x) = c$","C":r"$y\phi(y/x) = c$","D":r"$\phi(y/x) = xc$"},
 ["D"],"medium",["homogeneous-ode","substitution-y-vx","separable"],None),

(28,"MATH","M10",1,7,
 r"The particular solution of $\log\dfrac{dy}{dx} = 3x + 4y$, $y(0) = 0$ is",
 {"A":r"$4e^{3x} + 3e^{-4y} = 7$","B":r"$4e^{3x} + 3e^{4y} = 7$","C":r"$e^{3x} + e^{-4y} = 1$","D":r"$4e^{3x} + 3e^{-4y} = -7$"},
 ["A"],"easy",["separable-ode","initial-value","exponential"],None),

(29,"MATH","M11",1,7,
 r"Two numbers are selected at random from the numbers $1, 2, 3, 4, \ldots, 10$, without replacement. The probability that minimum of the two numbers is less than $5$ is",
 {"A":r"$\dfrac{1}{3}$","B":r"$\dfrac{2}{3}$","C":r"$\dfrac{1}{2}$","D":r"$\dfrac{1}{5}$"},
 ["B"],"easy",["combinatorial-probability","complement"],None),

(30,"MATH","M11",1,7,
 r"For the events $A$ and $B$ if $P(A) = P(A/B) = \dfrac{1}{4}$ and $P(B/A) = \dfrac{1}{2}$, then",
 {"A":r"$A$ and $B$ are independent","B":r"$A$ and $B$ are mutually exclusive","C":r"$P(A'/B) = \dfrac{1}{3}$","D":r"$P(B'/A') = 1/4$"},
 ["A"],"easy",["conditional-probability","independence"],None),

# ---------------- MATHEMATICS Cat-II (Q31-40) ----------------
(31,"MATH","M01",2,8,
 r"Let $X$ and $Y$ be two non-zero symmetric matrices of order $3$ and $Z$ be a non-zero skew symmetric matrix of order $3$. Then which of the following matrix/matrices are skew symmetric ?",
 {"A":r"$X^{3}Z^{4} - Z^{4}X^{3}$","B":r"$X^{5}Z^{5} - Z^{5}X^{5}$","C":r"$Y^{99}Z^{99} + Z^{99}Y^{99}$","D":r"$X^{19}Y^{7} + Y^{7}X^{19}$"},
 ["A","C"],"medium",["symmetric-matrix","skew-symmetric","transpose"],None),

(32,"MATH","M02",2,8,
 r"For non-zero $\alpha$, $a$, $b$, $c$, the determinant $\Delta = \begin{vmatrix} a & b & a\alpha + b \\ b & c & b\alpha + c \\ a\alpha + b & b\alpha + c & 0 \end{vmatrix}$ is equal to zero if",
 {"A":r"$a$, $b$, $c$ are in A. P.","B":r"$a$, $b$, $c$ are in G.P.","C":r"$a$, $b$, $c$ are in H. P.","D":r"$\alpha$ is a root of $ax^{2} + 2bx + c = 0$"},
 ["B","D"],"medium",["determinant","geometric-progression","factorisation"],None),

(33,"MATH","M03",2,8,
 r"If $z = \left(\dfrac{\sqrt{3}}{2} + \dfrac{i}{2}\right)^{2007} + \left(\dfrac{\sqrt{3}}{2} - \dfrac{i}{2}\right)^{2007}$, then",
 {"A":r"$z = 0$","B":r"$z = i$","C":r"$\operatorname{Re}(z) > 0$","D":r"$\operatorname{Im}(z) > 0$"},
 ["A"],"medium",["de-moivre","conjugates","polar-form"],None),

(34,"MATH","M04",2,8,
 r"The area of a triangle is $5$ sq. units. Two of its vertices are $(2, 1)$ and $(3, -2)$ and the third vertex lies on $y = x + 3$. The coordinates of the third vertex can be",
 {"A":r"$\left(-\dfrac{3}{2}, \dfrac{3}{2}\right)$","B":r"$\left(\dfrac{3}{2}, -\dfrac{3}{2}\right)$","C":r"$\left(\dfrac{7}{2}, \dfrac{14}{3}\right)$","D":r"$\left(\dfrac{7}{2}, \dfrac{13}{2}\right)$"},
 ["D"],"medium",["area-of-triangle","locus","key-dispute"],None),

(35,"MATH","M05",2,8,
 r"Let $\vec{V} = 2\hat{i} + \hat{j} - \hat{k}$ and $\vec{W} = \hat{i} + 3\hat{k}$. If $\vec{U}$ is a unit vector, then the maximum value of the scalar triple product $[\vec{U}\,\vec{V}\,\vec{W}]$ is",
 {"A":r"$59$","B":r"$\sqrt{59}$","C":r"$1$","D":r"$\sqrt{60}$"},
 ["B"],"easy",["scalar-triple-product","cross-product","maximum"],None),

(36,"MATH","M06",2,9,
 r"Let $f(x) = \lim\limits_{n \to \infty} \dfrac{x^{2n} - 1}{x^{2n} + 1}$, then",
 {"A":r"$f(x) = 1$ for $|x| > 1$","B":r"$f(x) = 1$ for $|x| = 1$","C":r"$f(x) = -1$ for $|x| < 1$","D":r"$f(x)$ is not defined for any values of $x$"},
 ["A","C"],"easy",["limit-of-sequence","piecewise-function"],None),

(37,"MATH","M07",2,9,
 r"If the line $ax + by + c = 0$ is a normal to the curve $xy = 2$, then",
 {"A":r"$a > 0, b > 0$","B":r"$a > 0, b < 0$","C":r"$a < 0, b > 0$","D":r"$a < 0, b < 0$"},
 ["B","C"],"medium",["normal","rectangular-hyperbola","slope-sign"],None),

(38,"MATH","M08",2,9,
 r"If $z = \log\sqrt{x^{2} + y^{2}}$, then which of the following is/are true ?",
 {"A":r"$y\dfrac{\partial z}{\partial x} + x\dfrac{\partial z}{\partial y} = 1$","B":r"$x\dfrac{\partial z}{\partial x} + y\dfrac{\partial z}{\partial y} = 1$","C":r"$x\dfrac{\partial z}{\partial x} + y\dfrac{\partial z}{\partial y} = \sqrt{x^{2} + y^{2}}$","D":r"$y\dfrac{\partial z}{\partial x} = x\dfrac{\partial z}{\partial y}$"},
 ["B","D"],"easy",["partial-derivative","logarithm","euler-theorem"],None),

(39,"MATH","M09",2,9,
 r"The value of $\alpha$ which satisfies $\displaystyle\int_{\pi/2}^{\alpha} \sin x\,dx = \sin 2\alpha$ $(\alpha \in [\pi, 2\pi])$ is/are",
 {"A":r"$\dfrac{7\pi}{4}$","B":r"$\dfrac{3\pi}{2}$","C":r"$\dfrac{7\pi}{6}$","D":r"$\dfrac{5\pi}{3}$"},
 ["B","C"],"medium",["definite-integral","trigonometric-equation"],None),

(40,"MATH","M10",2,9,
 r"The solution/solutions of $v = u\dfrac{dv}{du} + \left(\dfrac{dv}{du}\right)^{2}$, where $u = y$ and $v = xy$ is/are (where $c$, $c_{1}$ are arbitrary constants.)",
 {"A":r"$y = 0$","B":r"$y = 4x$","C":r"$y = -4x$","D":r"$xy = cy + c_{1}$"},
 ["A","C","D"],"hard",["clairaut-equation","singular-solution","substitution"],None),

# ---------------- PHYSICS Cat-I (Q41-65) ----------------
(41,"PHYS","P01",1,10,
 "The displacement of a particle executing SHM is given by $x = A\\sin(\\omega t + \\phi)$ where $A$ is amplitude. $\\dfrac{A}{\\omega}$ has the dimension of",
 {"A":"$LT^{-1}$","B":"$LT^{-1}$","C":"$LT$","D":"dimensionless"},
 ["A"],"hard",["dimensions","shm","dimensional-analysis"],None),

(42,"PHYS","P02",1,10,
 "Figure shows $(x,t)$, $(y,t)$ diagram of a particle moving in 2 dimensions. If the particle has a mass of $500$ gm, the force acting on the particle is",
 {"A":"$1\\,\\text{N}$ along $x$-axis","B":"$0.5\\,\\text{N}$ along $y$-axis","C":"$0.5\\,\\text{N}$ along $x$-axis","D":"$1\\,\\text{N}$ along $y$-axis"},
 ["D"],"medium",["kinematics","graph","force"],"fig-2023-q42"),

(43,"PHYS","P02",1,10,
 "Two trains of length $L_1$ and $L_2$ are moving with speeds $v_1$ and $v_2$ in opposite directions on parallel tracks. The time taken by each train till they cross each other is",
 {"A":"$\\dfrac{L_1 + L_2}{v_1 + v_2}$","B":"$\\dfrac{L_1 + L_2}{v_1 - v_2}$","C":"$\\dfrac{L_1}{v_1 + v_2}$","D":"$\\dfrac{L_1}{v_1 - v_2}$"},
 ["B"],"hard",["kinematics","relative-velocity","trains"],None),

(44,"PHYS","P02",1,11,
 "A constant power is supplied to a rotating disc. Angular velocity $(\\omega)$ of disc varies with angle of rotations $(\\theta)$ made by the disc as",
 {"A":"$\\omega \\propto \\theta$","B":"$\\omega \\propto \\theta^{1/3}$","C":"$\\omega \\propto \\theta^{2/3}$","D":"$\\omega \\propto \\theta^{2}$"},
 ["C"],"hard",["rotation","power","angular-velocity"],None),

(45,"PHYS","P03",1,11,
 "A massless string can carry a maximum mass $3\\,\\text{kg}$. If the string is pulled upward with an acceleration $2\\,\\text{m/s}^{2}$ then the maximum mass this string can carry is ($g = 10\\,\\text{m/s}^{2}$)",
 {"A":"$\\dfrac{15}{4}\\,\\text{kg}$","B":"$\\dfrac{5}{2}\\,\\text{kg}$","C":"$3\\,\\text{kg}$","D":"$12\\,\\text{kg}$"},
 ["B"],"hard",["newton-laws","tension","acceleration"],None),

(46,"PHYS","P03",1,11,
 "Two particles having masses $6\\,\\text{kg}$ and $4\\,\\text{kg}$ are moving with velocities $(5\\hat{i} - 2\\hat{j} + 10\\hat{k})$ and $(10\\hat{i} + 2\\hat{j} + 5\\hat{k})$ respectively. What is the velocity of their centre of mass?",
 {"A":"$(5\\hat{i} + 2\\hat{j} - 8\\hat{k})$","B":"$(7\\hat{i} - 2\\hat{j} + 8\\hat{k})$","C":"$(7\\hat{i} + 2\\hat{j} - 8\\hat{k})$","D":"$(5\\hat{i} - 2\\hat{j} + 8\\hat{k})$"},
 ["W"],"voided",["centre-of-mass","momentum","vectors"],None),

(47,"PHYS","P11",1,12,
 "In an ideal gas, root mean square speed of the gas molecules is $C$. If pressure of the gas is increased to three times its initial value, temperature remaining constant, what would be the r.m.s. speed?",
 {"A":"$C/3$","B":"$C$","C":"$3C$","D":"$\\sqrt{3}C$"},
 ["B"],"medium",["kinetic-theory","rms-speed","pressure"],None),

(48,"PHYS","P11",1,12,
 "In the figure, three processes of an ideal gas are shown. $CA$ denotes the adiabatic process, $BA$ denotes the isothermal process. Then $\\gamma$ for this gas is",
 {"A":"$\\dfrac{1}{\\ln 2}$","B":"$\\ln 2$","C":"$\\dfrac{\\ln 3}{\\ln 2}$","D":"$\\dfrac{\\ln 2}{\\ln 3}$"},
 ["B"],"hard",["thermodynamics","adiabatic","pv-diagram"],"fig-2023-q48"),

(49,"PHYS","P03",1,12,
 "A charge $q$ is situated at the centre of the circular base of a right circular cone of height $H$ and radius of the base is $r$. Electrostatic flux through the curved surface of the cone is",
 {"A":"$\\dfrac{q}{2\\varepsilon_0}$","B":"$\\dfrac{q}{3\\varepsilon_0}$","C":"$\\dfrac{qH}{4\\varepsilon_0 r}$","D":"$\\dfrac{q}{4\\varepsilon_0 r}$"},
 ["B"],"hard",["electrostatics","flux","gauss-law"],None),

(50,"PHYS","P03",1,12,
 "Consider two point charges $q_1$ and $q_2$ having masses $m_1$ and $m_2$ respectively. They are released from an initial separation $r_0$. The relative velocity when the separation becomes large is given by (where $M = m_1 + m_2$)",
 {"A":"$\\sqrt{\\dfrac{2Kq_1q_2}{Mr_0}}$","B":"$\\sqrt{\\dfrac{2Kq_1q_2\\mu}{r_0}}$","C":"$\\sqrt{\\dfrac{Kq_1q_2}{Mr_0}}$","D":"$\\sqrt{\\dfrac{Kq_1q_2}{r_0}}$"},
 ["A"],"hard",["electrostatics","energy-conservation","relative-velocity"],None),

(51,"PHYS","P13",1,12,
 "A glass slab of thickness $8\\,\\text{cm}$ contains the same number of waves as $10\\,\\text{cm}$ of water, when both are traversed by the same monochromatic light. If the refractive index of water is $\\dfrac{4}{3}$, the refractive index of glass is",
 {"A":"$\\dfrac{5}{4}$","B":"$\\dfrac{5}{3}$","C":"$\\dfrac{3}{2}$","D":"$\\dfrac{3}{5}$"},
 ["B"],"hard",["refraction","optical-path","refractive-index"],None),

(52,"PHYS","P14",1,12,
 "A collimated beam of light of diameter $1\\,\\text{mm}$ is propagating along $x$-axis. The beam is to be expanded to a collimated beam of diameter $10\\,\\text{mm}$ using a combination of two convex lenses. A lens of focal length $50\\,\\text{mm}$ and another lens with focal length $F$ are to be kept at a distance $d$ between them. The values of $F$ and $d$, respectively are",
 {"A":"$450\\,\\text{mm}$ and $10\\,\\text{mm}$","B":"$400\\,\\text{mm}$ and $500\\,\\text{mm}$","C":"$550\\,\\text{mm}$ and $600\\,\\text{mm}$","D":"$500\\,\\text{mm}$ and $550\\,\\text{mm}$"},
 ["D"],"hard",["lens","beam-expansion","focal-length"],None),

(53,"PHYS","P13",1,12,
 "When a light of particular wavelength falls on a plane surface at an angle of incidence $60^{\\circ}$ then the reflected light becomes completely plane polarized. Now the refractive index $(\\mu)$ of the material of the surface and the angle of refraction $(\\theta)$ passing through the plane surface are",
 {"A":"$\\mu = \\sqrt{2},\\; \\theta = 30^{\\circ}$","B":"$\\mu = \\sqrt{3},\\; \\theta = 30^{\\circ}$","C":"$\\mu = \\sqrt{3},\\; \\theta = 45^{\\circ}$","D":"$\\mu = 1/\\sqrt{3},\\; \\theta = 30^{\\circ}$"},
 ["B"],"medium",["refraction","polarization","brewster-angle"],None),

(54,"PHYS","P02",1,13,
 "Two particles execute SHM of the same amplitude and frequency along the same straight line. They pass one another when going in opposite directions each time, their displacement is half their amplitude. The phase difference between them is",
 {"A":"$210^{\\circ}$","B":"$30^{\\circ}$","C":"$60^{\\circ}$","D":"$180^{\\circ}$"},
 ["D"],"medium",["shm","phase-difference","amplitude"],None),

(55,"PHYS","P08",1,13,
 "Two solid cubes of the same weight are taken. One is made of Iron (density $8\\,\\text{gm/cc}$) and the other is made of aluminium (density $2.7\\,\\text{gm/cc}$). They are now weighed when fully immersed in water. Then inside water,",
 {"A":"both will suffer same loss of weight","B":"the Iron cube will weigh more than the aluminium cube","C":"both will have the same weight as before","D":"the aluminium cube will weigh more than the Iron cube"},
 ["B"],"hard",["fluid","buoyancy","density"],None),

(56,"PHYS","P03",1,13,
 "Steady current flows through a constricted conductor. The left of the constriction has diameter $D_1$, and current density $j_1$. If the current density is doubled as it emerges from the right side of the constriction, then $D_2$ is",
 {"A":"$\\dfrac{D_1}{\\sqrt{2}}$","B":"$\\dfrac{D_1}{2}$","C":"$\\sqrt{2}D_1$","D":"$\\sqrt{2}D_1$"},
 ["C"],"medium",["current-density","continuity","conductor"],None),

(57,"PHYS","P03",1,13,
 "Two concentric coplanar circular coils of radii $R$ and $R'$ carry steady currents $I$ and $I'$ in opposite directions (one clockwise other anticlockwise). The magnetic field at the centre is half that due to $I'$ alone. If $R = 2R'$, then $I/I'$ is",
 {"A":"$1:3$","B":"$1:2$","C":"$1:4$","D":"$1:1$"},
 ["D"],"hard",["magnetic-field","coils","biot-savart"],None),

(58,"PHYS","P03",1,14,
 "Two magnetic fields, inclined to each other at an angle $75^{\\circ}$, act on a bar magnet suspending on the plane of the magnetic fields. The magnitude of one magnetic field is $3\\sqrt{2} \\times 10^{-3}\\,\\text{T}$ and the bar magnet attains stable equilibrium at an angle $45^{\\circ}$ with the other magnetic field. The magnitude of the other magnetic field is",
 {"A":"$3 \\times 10^{-3}\\,\\text{T}$","B":"$\\sqrt{2}\\times 10^{-4}\\,\\text{T}$","C":"$6\\sqrt{3} \\times 10^{-3}\\,\\text{T}$","D":"$4 \\times 10^{-3}\\,\\text{T}$"},
 ["A"],"hard",["magnetic-field","equilibrium","torque"],None),

(59,"PHYS","P03",1,14,
 "An electron of charge $e$ revolves in a circular path of radius $r$ around nucleus. The magnetic field due to its orbital motion at the centre of nucleus is $B$. The frequency of rotation of electron is",
 {"A":"$\\dfrac{Br}{2\\mu_0 e}$","B":"$\\dfrac{2Br}{\\mu_0 e}$","C":"$\\dfrac{Br}{2\\mu_0 e}$","D":"$\\dfrac{Br}{4\\mu_0 e}$"},
 ["B"],"hard",["magnetic-field","electron-orbit","frequency"],None),

(60,"PHYS","E04",1,14,
 "In the circuit, the galvanometer $G$ shows zero deflection. If the batteries have negligible internal resistance, the value of the resistor $R$ will be",
 {"A":"$100\\,\\Omega$","B":"$200\\,\\Omega$","C":"$500\\,\\Omega$","D":"$1000\\,\\Omega$"},
 ["A"],"hard",["circuits","wheatstone-bridge","galvanometer"],"fig-2023-q60"),

(61,"PHYS","E04",1,15,
 "A cell of emf $E$ and internal resistance $r$ is connected across a load resistance $R$. The variation of power consumed in $R$ with load $R$ is shown in the figure. The co-ordinate of the point $M$ is",
 {"A":"$(1, 1)$","B":"$(\\dfrac{R}{r}, \\dfrac{E^{2}}{4r})$","C":"$(\\dfrac{E^{2}}{4R}, 1)$","D":"$(\\dfrac{r}{R}, \\dfrac{E^{2}}{4R})$"},
 ["D"],"hard",["circuits","power-max","load-resistance"],"fig-2023-q61"),

(62,"PHYS","P15",1,15,
 "A magnetic field of strength $B$ bends all the photoelectrons within a circle of radius $R$ when light of wavelength $\\lambda$ is incident on a certain metallic surface. The work function of the metal is proportional to ($a$ and $b$ are constants)",
 {"A":"$a - bR^{2}$","B":"$bR^{2}$","C":"$a + bR^{2}$","D":"independent of $R$"},
 ["A"],"hard",["photoelectric","magnetic-field","work-function"],None),

(63,"PHYS","P11",1,15,
 "A radioactive isotope has a decay constant $\\lambda$ and a molar mass $M$. Taking the Avogadro constant to be $L$, what is the activity of a sample of mass $m$ of this isotope?",
 {"A":"$\\dfrac{\\lambda m L}{M}$","B":"$\\dfrac{m\\lambda}{M}$","C":"$\\dfrac{\\lambda m}{M L}$","D":"$\\dfrac{\\lambda}{M}$"},
 ["A"],"medium",["radioactivity","decay-constant","activity"],None),

(64,"PHYS","P15",1,15,
 "The energy levels of a certain atom for 1st, 2nd and 3rd levels are $E_1$, $4E$, and $9E$ respectively. A photon of wavelength $\\lambda$ is emitted for a transition $3 \\to 1$. The wavelength of emission for transition $2 \\to 1$ will be",
 {"A":"$\\dfrac{\\lambda}{3}$","B":"$\\dfrac{3\\lambda}{4}$","C":"$\\dfrac{4\\lambda}{3}$","D":"$3\\lambda$"},
 ["D"],"hard",["atomic-structure","energy-levels","photon"],None),

(65,"PHYS","P11",1,15,
 "A radioactive nucleus ${}^{A}_{Z}X$ emits three $\\alpha$ particles and five $\\beta$ particles. The ratio of the number of neutrons to that of protons in the final product nucleus is",
 {"A":"$\\dfrac{A-Z-11}{Z-1}$","B":"$\\dfrac{A-Z}{Z-1}$","C":"$\\dfrac{A-Z-11}{Z-6}$","D":"$\\dfrac{A-Z-12}{Z-6}$"},
 ["A"],"hard",["radioactivity","nuclear-decay","neutrons-protons"],None),

# ---------------- PHYSICS Cat-II (Q66-70) ----------------
(66,"PHYS","P03",2,16,
 "The spring of spring constant $k$ is attached to a block of mass $4\\,\\text{kg}$. Initially the block is at rest and the spring is unstretched. The horizontal surface is frictionless. A constant horizontal force $F$ is applied on the block, and it moves through a distance $x$. Then which of the following statement(s) is/are true?",
 {"A":"The energy is conserved in this process.","B":"The velocity $(v)$ of block varies linearly with $x$.","C":"If $x = 0.5\\,\\text{m}$, $k = 24\\,\\text{N/m}$, $F = 10\\,\\text{N}$, then speed of the block is $1\\,\\text{m/s}$.","D":"At $x = F/k$, acceleration of the block will be zero."},
 ["A","C","D"],"hard",["spring","work-energy","force"],"fig-2023-q66"),

(67,"PHYS","P04",2,16,
 "The potential energy of a particle in a field of force is equal to $A - Bx^{2}$ where $x$ is the displacement along a straight line from the equilibrium position. The force acting on the particle is",
 {"A":"proportional to $x^{2}$.","B":"proportional to $x$.","C":"independent of $x$.","D":"directed away from equilibrium position."},
 ["B","D"],"hard",["work-energy","potential-energy","force"],None),

(68,"PHYS","E04",2,16,
 "In the circuit shown, the capacitor is initially charged by a supply of emf $E$. The switch is closed at time $t = t_0$. Then which statement(s) is/are true?",
 {"A":"Immediately after switch on, the current in the circuit is $E/R$.","B":"The charge on the capacitor decreases exponentially to zero.","C":"The current through the resistor decreases exponentially to zero.","D":"The voltage across the capacitor remains constant."},
 ["A","C","D"],"hard",["circuits","rc-circuit","transient"],"fig-2023-q68"),

(69,"PHYS","P03",2,17,
 "A solid non-conducting sphere of radius $R$ carries a non-uniform charge distribution with charge density $\\rho = \\rho_0 r$ ($\\rho_0 = $ constant) and $r$ is the distance from the centre of the sphere. Then which of the following statement(s) is/are true?",
 {"A":"The total charge $Q$ on the sphere is $\\dfrac{\\pi \\rho_0 R^{3}}{4}$.","B":"The total charge $Q$ on the sphere is $\\dfrac{3\\pi \\rho_0 R^{3}}{4}$.","C":"The electric field inside the sphere is $\\dfrac{Q}{4\\pi\\varepsilon_0 R^{4}} r$.","D":"The electric field inside the sphere is $\\dfrac{Q}{4\\pi\\varepsilon_0 R^{3}} r$."},
 ["A","C"],"hard",["electrostatics","gauss-law","charge-density"],None),

(70,"PHYS","P12",2,17,
 "White light is used to illuminate the two slits in a Young's double slit experiment. The separation between the slits is $b$ and the screen is at a distance $d$ ($d \\gg b$) from the slits. $P$ is a point on the screen directly in front of $S_1$. Then which of the following statement(s) is/are true?",
 {"A":"On the screen, there will be coloured fringes except central fringe.","B":"The path difference at point $P$ is $\\dfrac{b^{2}}{2d}$.","C":"For destructive interference at point $P$, the condition will be $\\dfrac{b^{2}}{2d} = (n+\\frac{1}{2})\\lambda$ ($n = 1,2,\\ldots$).","D":"For constructive interference at point $P$, the condition will be $\\dfrac{b^{2}}{2d} = n\\lambda$."},
 ["A","C","D"],"hard",["wave-optics","young-double-slit","interference"],"fig-2023-q70"),

# ---------------- CHEMISTRY Cat-I (Q71-85) ----------------
(71,"CHEM","C01",1,18,
 "If the ground state energy of H-atom is $-13.6\\,\\text{eV}$, the energy of second excited state of $\\text{Li}^{2+}$ ion will be",
 {"A":"$-13.6\\,\\text{eV}$","B":"$-30.6\\,\\text{eV}$","C":"$-6.04\\,\\text{eV}$","D":"$+13.6\\,\\text{eV}$"},
 ["A"],"hard",["atomic-structure","bohr-model","energy-levels"],None),

(72,"CHEM","C01",1,18,
 "If the radius of second Bohr orbit of H atom is $r_2$, the radius of third Bohr orbit will be",
 {"A":"$\\dfrac{4}{9}r_2$","B":"$\\dfrac{9}{4}r_2$","C":"$\\dfrac{9}{2}r_2$","D":"$9r_2$"},
 ["C"],"hard",["atomic-structure","bohr-model","radius"],None),

(73,"CHEM","C01",1,18,
 "In the ground state of $\\text{Cu}^{+}$, the number of shells occupied, subshells, filled orbitals and unpaired electrons are respectively",
 {"A":"$4, 8, 15, 0$","B":"$3, 6, 14, 0$","C":"$3, 6, 15, 1$","D":"$4, 7, 14, 2$"},
 ["B"],"medium",["atomic-structure","electronic-configuration","cu+"],None),

(74,"CHEM","C04",1,18,
 "How many electrons would be required to deposit $6.35\\,\\text{gm}$ of copper at the cathode during the electrolysis of an aqueous solution of copper sulphate? (Atomic mass of Cu $= 63.5$, $N_A = $ Avogadro's number)",
 {"A":"$\\dfrac{N_A}{20}$","B":"$\\dfrac{N_A}{10}$","C":"$\\dfrac{2N_A}{5}$","D":"$\\dfrac{N_A}{5}$"},
 ["C"],"hard",["electrochemistry","electrolysis","faraday"],None),

(75,"CHEM","C01",1,19,
 "The probability of finding electrons in $d_{z^{2}}$ orbital is",
 {"A":"along $X$ and $Z$ axis","B":"along $X$ and $Y$ axis","C":"along $Y$ and $Z$ axis","D":"at an angle $45^{\\circ}$ with $Z$ axis"},
 ["D"],"hard",["atomic-structure","orbitals","d-orbital"],None),

(76,"CHEM","C02",1,19,
 "What is the correct order of bond dissociation energy among $\\text{N}_2$, $\\text{O}_2$ and $\\text{O}_2^{-}$?",
 {"A":"$\\text{N}_2 > \\text{O}_2 > \\text{O}_2^{-}$","B":"$\\text{O}_2 > \\text{O}_2^{-} > \\text{N}_2$","C":"$\\text{N}_2 > \\text{O}_2 > \\text{O}_2^{-}$","D":"$\\text{O}_2^{-} > \\text{O}_2 > \\text{N}_2$"},
 ["C"],"hard",["chemical-bonding","bond-energy","molecular-orbital"],None),

(77,"CHEM","C02",1,19,
 "Equal number of $\\sigma$ and $\\pi$ bonds are present in",
 {"A":"$\\text{HCO}_3^{-}$","B":"$\\text{CH}_2(\\text{CN})_2$","C":"$(\\text{CN})_2$","D":"$\\text{XeO}_4$"},
 ["D"],"hard",["chemical-bonding","sigma-pi-bonds","structure"],None),

(78,"CHEM","C03",1,19,
 "How many litre(s) of water is to be added to $1\\,\\text{L}$ of an aqueous solution of HCl with a $1\\,\\text{N}$ concentration so that the resulting solution becomes $0.1\\,\\text{N}$?",
 {"A":"$10\\,\\text{L}$","B":"$1\\,\\text{L}$","C":"$9\\,\\text{L}$","D":"$20\\,\\text{L}$"},
 ["C"],"medium",["solutions","normality","dilution"],None),

(79,"CHEM","C03",1,19,
 "$6.02 \\times 10^{20}$ molecules of glucose are present in $100\\,\\text{ml}$ of its solution. The concentration of the glucose solution will be",
 {"A":"$0.01\\,\\text{M}$","B":"$0.001\\,\\text{M}$","C":"$0.1\\,\\text{M}$","D":"$0.2\\,\\text{M}$"},
 ["A"],"hard",["stoichiometry","molarity","concentration"],None),

(80,"CHEM","C05",1,19,
 "A given weak acid has its dissociation constant $k_a = 1.0 \\times 10^{-5}$. Calculate the equilibrium constant when it reacts with a strong base.",
 {"A":"$10^{5}$","B":"$10^{10}$","C":"$10^{9}$","D":"$10^{17}$"},
 ["C"],"hard",["equilibrium","dissociation","acid-base"],None),

(81,"CHEM","C02",1,20,
 "The correct order of covalent character is:",
 {"A":"$\\text{LiCl} < \\text{BeCl}_2 < \\text{BCl}_3 < \\text{CCl}_4$","B":"$\\text{LiCl} > \\text{BeCl}_2 > \\text{BCl}_3 > \\text{CCl}_4$","C":"$\\text{LiCl} < \\text{BeCl}_2 < \\text{BCl}_3 < \\text{CCl}_4$","D":"$\\text{LiCl} > \\text{BeCl}_2 < \\text{BCl}_3 < \\text{CCl}_4$"},
 ["C"],"hard",["chemical-bonding","fajans-rule","covalent-character"],None),

(82,"CHEM","C05",1,20,
 "The ratio of $K_p$ to $K_c$ for the reaction, $\\text{CO}(g) + \\dfrac{1}{2}\\text{O}_2(g) \\rightleftharpoons \\text{CO}_2(g)$ is",
 {"A":"$(RT)^{1/2}$","B":"$(RT)^{-1/2}$","C":"$RT$","D":"$1$"},
 ["A"],"medium",["equilibrium","kp-kc","thermodynamics"],None),

(83,"CHEM","C02",1,20,
 "Pair of species having identical shapes for molecules is",
 {"A":"$\\text{BF}_3, \\text{PF}_3$","B":"$\\text{CF}_4, \\text{SF}_4$","C":"$\\text{XeF}_2, \\text{CO}_2$","D":"$\\text{PF}_5, \\text{BrF}_5$"},
 ["C"],"medium",["chemical-bonding","vsepr","molecular-shape"],None),

(84,"CHEM","C08",1,20,
 "How many tertiary carbon atom(s) is/are present in the given compound? $\\text{CH}_3$-$\\text{CH}$(\\text{CH}_3$)-$\\text{CH}_2$-$\\text{CH}$(\\text{CH}_3$)-$\\text{CH}_2$-$\\text{CH}_3$",
 {"A":"$1$","B":"$2$","C":"$3$","D":"nil/absent"},
 ["A"],"hard",["organic","carbon-types","structural-formula"],None),

(85,"CHEM","C08",1,20,
 "Among the following alcohols, which would react faster with conc. HCl and $\\text{ZnCl}_2$?",
 {"A":"pentanol","B":"$2$-methylbutanol","C":"$2$-pentanol","D":"$2$-methylbutan-$2$-ol"},
 ["D"],"medium",["organic","alcohols","reactivity"],None),

# ---------------- CHEMISTRY Cat-II (Q86-90) ----------------
(86,"CHEM","C01",2,21,
 "The Lyman Series for H atom corresponds to the transition, $n_2 \\to n_1$, when",
 {"A":"$n_2 = 2, n_1 = 1$","B":"$n_2 = 3, n_1 = 2$","C":"$n_2 = 4, n_1 = 1$","D":"$n_2 = 4, n_1 = 3$"},
 ["A","C"],"medium",["atomic-structure","lyman-series","hydrogen-spectrum"],None),

(87,"CHEM","C01",2,21,
 "The set of four quantum numbers of a single $p$ electron having $n + l \\leq 4$ may be",
 {"A":"$3, 1, +\\frac{1}{2}, -\\frac{1}{2}$","B":"$2, 1, -1, +\\frac{1}{2}$","C":"$3, 1, 0, -\\frac{1}{2}$","D":"$2, 1, -2, +\\frac{1}{2}$"},
 ["B","C"],"hard",["atomic-structure","quantum-numbers","p-electron"],None),

(88,"CHEM","C05",2,21,
 "For the equilibrium $\\text{H}_2\\text{O}(\\text{solid}) \\rightleftharpoons \\text{H}_2\\text{O}(\\text{liq.})$ the correct statement is",
 {"A":"If pressure of the system is increased, more ice will be melted to water.","B":"Pressure has no effect upon the equilibrium.","C":"If pressure increases, more ice will be formed.","D":"Pressure can shorten the time to reach the equilibrium."},
 ["W"],"voided",["equilibrium","phase-equilibrium","le-chatelier"],None),

(89,"CHEM","C06",2,21,
 "Choose the correct reaction:",
 {"A":"slag + flux = gangue","B":"slag + gangue = flux","C":"$\\text{SiO}_2 + \\text{CaO} = \\text{CaSiO}_3$","D":"flux + gangue = slag"},
 ["C","D"],"medium",["metallurgy","flux-slag","gangue"],None),

(90,"CHEM","C03",2,21,
 "Ethylenediaminetetraacetic acid can be an example of",
 {"A":"Arrhenius acid","B":"Bronsted acid","C":"Lewis base","D":"Arrhenius base"},
 ["A","B","C"],"hard",["acids-bases","edta","lewis-arrhenius"],None),

# ---------------- FEEE Cat-I (Q91-100) ----------------
(91,"FEEE","E05",1,22,
 "A current source $i(t)$ is applied to a series RLC circuit as shown in the figure. The maximum potential difference across the resistor is",
 {"A":"$10\\,\\text{V}$","B":"$15\\,\\text{V}$","C":"$5\\,\\text{V}$","D":"$20\\,\\text{V}$"},
 ["B"],"hard",["ac-circuits","rlc-circuit","impedance"],"fig-2023-q91"),

(92,"FEEE","E05",1,22,
 "If $V_1$ and $V_2$ are the potential drops across the capacitors $C_1$ and $C_2$ respectively, then the correct values of $V_1$ and $V_2$ are, $\\text{(Given: } C_1 = 5\\,\\mu\\text{F}, C_2 = 10\\,\\mu\\text{F})$",
 {"A":"$V_1 = \\dfrac{10}{3},\\; V_2 = 10$","B":"$V_1 = 10,\\; V_2 = \\dfrac{10}{3}$","C":"$V_1 = \\dfrac{10}{3},\\; V_2 = \\dfrac{10}{3}$","D":"$V_1 = 10,\\; V_2 = 10$"},
 ["B"],"hard",["ac-circuits","capacitor-divider","voltage"],None),

(93,"FEEE","E05",1,22,
 "Find the r.m.s. value of $10 + 10\\sin 100\\pi t\\,\\text{V}$.",
 {"A":"$12.25\\,\\text{V}$","B":"$7.07\\,\\text{V}$","C":"$22.75\\,\\text{V}$","D":"$70.71\\,\\text{V}$"},
 ["A"],"hard",["ac-circuits","rms-value","form-factor"],None),

(94,"FEEE","E04",1,22,
 "In the circuit given, the voltage $V_{AB}$ is (with $50\\,\\text{V}$, $5\\,\\Omega$; $40\\,\\text{V}$, $4\\,\\Omega$; $30\\,\\text{V}$, $3\\,\\Omega$; $2\\,\\Omega$)",
 {"A":"$35\\,\\text{V}$","B":"$28.2\\,\\text{V}$","C":"$38.3\\,\\text{V}$","D":"$42.6\\,\\text{V}$"},
 ["W"],"voided",["dc-circuits","thevenin","voltage"],"fig-2023-q94"),

(95,"FEEE","E04",1,23,
 "Find the equivalent capacitance of the combination shown in the figure across X-Y.",
 {"A":"$4\\,\\mu\\text{F}$","B":"$7\\,\\mu\\text{F}$","C":"$\\dfrac{4}{3}\\,\\mu\\text{F}$","D":"$3\\,\\mu\\text{F}$"},
 ["A"],"voided",["dc-circuits","capacitor-combination","equivalent-capacitance"],"fig-2023-q95"),

(96,"FEEE","E02",1,23,
 "If the supply frequency of a transformer increases, the secondary output voltage of the transformer",
 {"A":"increases","B":"decreases","C":"remains unchanged","D":"follows the primary"},
 ["A"],"easy",["transformers","frequency","emf-equation"],None),

(97,"FEEE","E02",1,23,
 "If a transformer is connected to a direct current supply, the result is",
 {"A":"damage of the transformer","B":"no effect","C":"operation at low frequency","D":"operation at higher frequency"},
 ["A"],"easy",["transformers","dc-supply","core-saturation"],None),

(98,"FEEE","E03",1,23,
 "A dc motor develops a torque of $120\\,\\text{Nm}$ at $20\\,\\text{rps}$. At $30\\,\\text{rps}$, it will develop a torque of",
 {"A":"$160\\,\\text{Nm}$","B":"$120\\,\\text{Nm}$","C":"$80\\,\\text{Nm}$","D":"$40\\,\\text{Nm}$"},
 ["C"],"medium",["electrical-machines","dc-motor","torque"],None),

(99,"FEEE","E03",1,23,
 "For a dc shunt motor, if the excitation is changed,",
 {"A":"torque will remain constant.","B":"torque will change but power will remain constant.","C":"both torque and power will change.","D":"torque, power and speed, all will change."},
 ["B"],"hard",["electrical-machines","dc-shunt-motor","excitation"],None),

(100,"FEEE","E05",1,23,
 "The average power delivered to an impedance $(4 - j3)\\,\\Omega$ by a current $5\\cos(100\\pi t + 100^{\\circ})\\,\\text{A}$ is",
 {"A":"$4\\sqrt{2}\\,\\text{W}$","B":"$50\\,\\text{W}$","C":"$62.5\\,\\text{W}$","D":"$125\\,\\text{W}$"},
 ["B"],"hard",["ac-circuits","power","impedance"],None),
]
