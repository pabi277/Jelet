# JELET 2023 Paper-I Set A — question data, validated against WBJEEB Final Answer Key JEEB/Reg-267/23 (03-08-2023).
# Q1–Q40 (Mathematics, PDF pages 3–9), Q41–Q70 (Physics, PDF pages 10–17) and Q71–Q100 (Chemistry + FEEE, PDF pages 18–23): verbatim visual transcription from the official Set A booklet.
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
# Q41–Q70: verbatim visual transcription from 180-DPI renders of the official Set A booklet
# (PDF pages 10–17, read with read_file before editing; figures from 300-DPI crops).
# Where a printed figure splits a sentence (Q42) the break is rendered as ". ".
# Key: JEEB/Reg-267/23, Series-A column. Q46 is withdrawn (W). Q54: documented key dispute.
(41,"PHYS","P01",1,10,
 r"The displacement of a particle executing SHM is given by $x = A\sin(\omega t + \phi)$ where $A$ is the amplitude, $\omega$ denotes the angular frequency and $\phi$ denotes the phase. $\dfrac{A}{\phi}$ has the dimension of",
 {"A":r"$L$","B":r"$LT^{-1}$","C":r"$LT$","D":r"dimensionless"},
 ["A"],"easy",["dimensions","shm","phase"],None),

(42,"PHYS","P03",1,10,
 r"Figure shows $(x, t)$, $(y, t)$ diagram of a particle moving in 2 dimensions. If the particle has a mass of 500 gm, the force acting on the particle is",
 {"A":r"$1$ N along $x$-axis","B":r"$0.5$ N along $y$-axis","C":r"$0.5$ N along $x$-axis","D":r"$1$ N along $y$-axis"},
 ["D"],"medium",["newtons-second-law","position-time-graph","two-dimensional-motion"],"fig-2023-q42"),

(43,"PHYS","P02",1,10,
 r"Two trains of length $L_{1}$ and $L_{2}$ are moving with speeds $V_{1}$ and $V_{2}$ in opposite directions on parallel tracks. The time taken by each train till they cross each other is",
 {"A":r"$\dfrac{L_{1} + L_{2}}{V_{1} - V_{2}}$","B":r"$\dfrac{L_{1} + L_{2}}{V_{1} + V_{2}}$","C":r"$\dfrac{L_{1} - L_{2}}{V_{1} + V_{2}}$","D":r"$\dfrac{L_{1} - L_{2}}{V_{1} - V_{2}}$"},
 ["B"],"easy",["relative-velocity","crossing-trains"],None),

(44,"PHYS","P04",1,10,
 r"A constant power is supplied to a rotating disc. Angular velocity $(\omega)$ of disc varies with angle of rotations $(\theta)$ made by the disc as",
 {"A":r"$\omega \propto \theta$","B":r"$\omega \propto \theta^{2}$","C":r"$\omega \propto \theta^{1/3}$","D":r"$\omega \propto \theta^{2/3}$"},
 ["C"],"medium",["power","rotational-kinetic-energy","work-energy"],None),

(45,"PHYS","P03",1,10,
 r"A massless string can carry a maximum mass 3 kg. If the string is pulled upward with an acceleration $2\ \text{m/s}^{2}$ then the maximum mass this string can carry is $[g = 10\ \text{m/s}^{2}]$",
 {"A":r"$\dfrac{15}{4}\,\text{Kg}$","B":r"$\dfrac{5}{2}\,\text{Kg}$","C":r"$3\,\text{Kg}$","D":r"$1\dfrac{1}{2}\,\text{Kg}$"},
 ["B"],"easy",["tension","accelerating-frame","breaking-strength"],None),

(46,"PHYS","P03",1,11,
 r"Two particles having masses 6 Kg and 4 Kg are moving with velocities $5\hat{i} - 2\hat{j} + 10\hat{k}$ and $10\hat{i} + 2\hat{j} + 5\hat{k}$ respectively. What is the velocity of their centre of mass ?",
 {"A":r"$5\hat{i} + 2\hat{j} - 8\hat{k}$","B":r"$7\hat{i} - 2\hat{j} + 8\hat{k}$","C":r"$7\hat{i} + 2\hat{j} - 8\hat{k}$","D":r"$5\hat{i} - 2\hat{j} + 8\hat{k}$"},
 ["W"],"easy",["centre-of-mass","velocity-vector","withdrawn"],None),

(47,"PHYS","P11",1,11,
 r"In an ideal gas root mean square speed of the gas molecules is C. If pressure of the gas is increased to three times its initial value, temperature remaining constant, what would be the r. m. s. speed ?",
 {"A":r"$C/3$","B":r"$C$","C":r"$3C$","D":r"$3/C$"},
 ["B"],"easy",["kinetic-theory","rms-speed","isothermal"],None),

(48,"PHYS","P11",1,11,
 r"In the figure, three processes of an ideal gas are shown. CA denotes the adiabatic process, BA denotes the isothermal process. Then $\gamma$ for this gas is",
 {"A":r"$\dfrac{1}{1 - \ln 2}$","B":r"$\dfrac{1}{1 - \dfrac{\ln 2}{\ln 3}}$","C":r"$\dfrac{\ln 3}{\ln 2}$","D":r"$\dfrac{1}{1 - \dfrac{\ln 3}{\ln 2}}$"},
 ["B"],"medium",["adiabatic","isothermal","pv-diagram","gamma"],"fig-2023-q48"),

(49,"PHYS","E04",1,11,
 r"A charge $q$ is situated at the centre of the circular base of a right circular cone of height $H$ and radius of the base is $r$. Electrostatic flux through the curved surface of the cone is",
 {"A":r"$\dfrac{q}{\varepsilon_{0}}$","B":r"$\dfrac{q}{2\varepsilon_{0}}$","C":r"$\dfrac{q}{4\varepsilon_{0}}$","D":r"$\dfrac{qH}{4\varepsilon_{0}r}$"},
 ["B"],"medium",["gauss-law","electric-flux","symmetry"],None),

(50,"PHYS","P04",1,12,
 r"Consider two point charges $q_{1}$ and $q_{2}$ having masses $m_{1}$ and $m_{2}$ respectively. They are released from an initial separation $r_{0}$. The relative velocity when the separation becomes large is given by $\left(K = \dfrac{1}{4\pi\varepsilon_{0}};\ \dfrac{1}{\mu} = \dfrac{1}{m_{1}} + \dfrac{1}{m_{2}};\ M = m_{1} + m_{2}\right)$",
 {"A":r"$\sqrt{\dfrac{2}{\mu}\dfrac{Kq_{1}q_{2}}{r_{0}}}$","B":r"$\sqrt{\dfrac{2Kq_{1}q_{2}\mu}{r_{0}}}$","C":r"$\sqrt{\dfrac{Kq_{1}q_{2}}{Mr_{0}}}$","D":r"$\dfrac{Kq_{1}q_{2}}{r_{0}}$"},
 ["A"],"medium",["energy-conservation","momentum-conservation","reduced-mass","coulomb"],None),

(51,"PHYS","P13",1,12,
 r"A glass slab of thickness 8 cm contains the same number of waves as 10 cm of water, when both are traversed by the same monochromatic light. If the refractive index of water is $\dfrac{4}{3}$, the refractive index of glass is",
 {"A":r"$\dfrac{5}{4}$","B":r"$\dfrac{5}{3}$","C":r"$\dfrac{3}{2}$","D":r"$\dfrac{3}{5}$"},
 ["B"],"easy",["refractive-index","optical-path","wavelength-in-medium"],None),

(52,"PHYS","P14",1,12,
 r"A collimated beam of light of diameter 1 mm is propagating along x-axis. The beam is to be expanded to a collimated beam of diameter 10 mm using a combination of two convex lenses. A lens of focal length of 50 mm and another lens with focal length ‘F’ are to be kept at a distance ‘d’ between them. The values of F and d, respectively are",
 {"A":r"$450$ mm and $10$ mm","B":r"$400$ mm and $500$ mm","C":r"$550$ mm and $600$ mm","D":r"$500$ mm and $550$ mm"},
 ["D"],"medium",["lens-combination","beam-expander","afocal-system"],None),

(53,"PHYS","P13",1,12,
 r"When a light of particular wavelength falls on a plane surface at an angle of incidence $60^{\circ}$ then the reflected light becomes completely plane polarized. Now the refractive index $(\mu)$ of the material of the surface and the angle of the refraction $(\theta_{r})$ passing through the plane surface are",
 {"A":r"$\mu = \sqrt{2},\ \theta_{r} = 30^{\circ}$","B":r"$\mu = \sqrt{3},\ \theta_{r} = 30^{\circ}$","C":r"$\mu = \sqrt{3},\ \theta_{r} = 45^{\circ}$","D":r"$\mu = \dfrac{1}{2},\ \theta_{r} = 30^{\circ}$"},
 ["B"],"easy",["brewster-angle","polarization","snells-law"],None),

(54,"PHYS","P03",1,13,
 r"Two particles execute SHM of the same amplitude and frequency along the same straight line. They pass one another when going in opposite directions each time, their displacement is half their amplitude. The phase difference between them is",
 {"A":r"$210^{\circ}$","B":r"$30^{\circ}$","C":r"$90^{\circ}$","D":r"$180^{\circ}$"},
 ["D"],"hard",["shm","phase-difference","key-dispute"],None),

(55,"PHYS","P08",1,13,
 r"Two solid cubes of the same weight are taken. One is made of Iron (density 8 gm/cc) and the other is made of aluminium (density 2.7 gm/cc). They are now weighed when fully immersed in water. Then inside water,",
 {"A":r"both will suffer same loss of weight.","B":r"the Iron cube will weigh more than the aluminium cube.","C":r"both will have the same weight as before.","D":r"the aluminium cube will weigh more than the Iron cube."},
 ["B"],"easy",["buoyancy","archimedes-principle","apparent-weight"],None),

(56,"PHYS","E04",1,13,
 r"Steady current flows through a constricted conductor. The left of the constriction has diameter $D_{1}$ and current density $j_{1}$. If the current density is doubled as it emerges from the right side of the constriction, then $D_{2}$ is",
 {"A":r"$\dfrac{1}{2}D_{1}$","B":r"$D_{1}$","C":r"$\dfrac{D_{1}}{\sqrt{2}}$","D":r"$\sqrt{2}D_{1}$"},
 ["C"],"easy",["current-density","continuity","steady-current"],"fig-2023-q56"),

(57,"PHYS","E01",1,13,
 r"Two concentric coplanar circular coils of radii $R$ and $R'$ carry steady currents $I$ and $I'$ in opposite directions (one clockwise other anticlockwise). The magnetic field at the centre is half that due to $I'$ alone. If $R = 2R'$, then $\dfrac{I}{I'}$ is",
 {"A":r"$1 : 3$","B":r"$1 : 2$","C":r"$1 : 4$","D":r"$1 : 1$"},
 ["D"],"medium",["magnetic-field-circular-loop","superposition"],None),

(58,"PHYS","E01",1,14,
 r"Two magnetic fields, inclined to each other at an angle $75^{\circ}$, act on a bar magnet suspending on the plane of the magnetic fields. The magnitude of one magnetic field is $3\sqrt{2} \times 10^{-3}$ T and the bar magnet attains stable equilibrium at an angle $45^{\circ}$ with the other magnetic field. The magnitude of the other magnetic field is",
 {"A":r"$3 \times 10^{-3}\,\text{T}$","B":r"$\sqrt{2} \times 10^{-4}\,\text{T}$","C":r"$6\sqrt{3} \times 10^{-3}\,\text{T}$","D":r"$4 \times 10^{-3}\,\text{T}$"},
 ["A"],"medium",["bar-magnet","torque-equilibrium","magnetic-fields"],None),

(59,"PHYS","E01",1,14,
 r"An electron of charge $e$ revolves in a circular path of radius $r$ around nucleus. The magnetic field due to its orbital motion at the side of nucleus is $B$. The frequency of rotation of electron is",
 {"A":r"$\dfrac{Br}{\mu_{0}e}$","B":r"$\dfrac{2Br}{\mu_{0}e}$","C":r"$\dfrac{Br}{2\mu_{0}e}$","D":r"$\dfrac{Br}{4\mu_{0}e}$"},
 ["B"],"easy",["magnetic-field-circular-loop","orbital-current"],None),

(60,"PHYS","E01",1,14,
 r"In the circuit, the galvanometer G shows zero deflection. If the batteries have negligible internal resistance, the value of the resistor R will be",
 {"A":r"$100\ \Omega$","B":r"$200\ \Omega$","C":r"$500\ \Omega$","D":r"$1000\ \Omega$"},
 ["A"],"easy",["galvanometer-null","potential-divider","kirchhoff"],"fig-2023-q60"),

(61,"PHYS","E04",1,15,
 r"A cell of emf $E$ and internal resistance $r$ is connected across a load resistance $R$. The variation of power consumed in $R$ with load $(R)$ is shown in the figure. The co-ordinate of the point M is",
 {"A":r"$(1, 1)$","B":r"$\left(\dfrac{1}{4}, 1\right)$","C":r"$\left(1, \dfrac{1}{2}\right)$","D":r"$\left(1, \dfrac{1}{4}\right)$"},
 ["D"],"medium",["maximum-power-transfer","internal-resistance"],"fig-2023-q61"),

(62,"PHYS","P15",1,15,
 r"A magnetic field of strength $B$ bends all the photoelectrons within a circle of radius $R$ when light of wavelength $\lambda$ is incident on a certain metallic surface. The work function of the metal is proportional to ($a$ and $b$ are constants)",
 {"A":r"$a - bR^{2}$","B":r"$R^{2}$","C":r"$a + bR^{2}$","D":r"independent of $R$"},
 ["A"],"medium",["photoelectric-effect","work-function","magnetic-force-circular-path"],None),

(63,"PHYS","P15",1,15,
 r"A radioactive isotope has a decay constant $\lambda$ and a molar mass $M$. Taking the Avogadro constant to be $L$, what is the activity of a sample of mass $m$ of this isotope ?",
 {"A":r"$\dfrac{\lambda mL}{M}$","B":r"$\dfrac{m\lambda}{ML}$","C":r"$\lambda mML$","D":r"$\dfrac{mL}{\lambda M}$"},
 ["A"],"easy",["radioactivity","activity","avogadro"],None),

(64,"PHYS","P15",1,15,
 r"The energy levels of a certain atom for $1^{\text{st}}$, $2^{\text{nd}}$ and $3^{\text{rd}}$ levels are $E$, $\dfrac{4E}{3}$ and $2E$ respectively. A photon of wavelength $\lambda$ is emitted for a transition $3 \rightarrow 1$. The wavelength of emission for transition $2 \rightarrow 1$ will be",
 {"A":r"$\dfrac{\lambda}{3}$","B":r"$\dfrac{3\lambda}{4}$","C":r"$\dfrac{4\lambda}{3}$","D":r"$3\lambda$"},
 ["D"],"easy",["energy-levels","photon-emission","wavelength"],None),

(65,"PHYS","P15",1,15,
 r"A radioactive nucleus ${}_{Z}^{A}X$ emits three $\alpha$ particles and five $\beta$ particles. The ratio of the number of neutrons to that of protons in the final product nucleus is",
 {"A":r"$\dfrac{A - Z - 11}{Z - 1}$","B":r"$\dfrac{A - Z}{Z - 1}$","C":r"$\dfrac{A - Z - 11}{Z - 6}$","D":r"$\dfrac{A - Z - 12}{Z - 6}$"},
 ["A"],"easy",["radioactive-decay","alpha-beta","nucleon-count"],None),

# ---------------- PHYSICS Cat-II (Q66-70) ----------------
(66,"PHYS","P04",2,16,
 r"The spring of spring constant $k$ is attached to a block mass of 4 Kg. Initially the block is at rest and the spring is unstretched. The horizontal surface is frictionless. A constant horizontal force $F$ is applied on the block, and it moves through a distance $x$. Then which of the following statement(s) is/are true ?",
 {"A":r"The energy is conserved in this process.","B":r"The velocity $(v)$ of block varies linearly with $x$.","C":r"If $x = 0.5$ m, $k = 24$ N/m, $F = 10$ N, then speed of the block is 1 m/s.","D":r"At $x = \dfrac{F}{k}$, acceleration of the block will be zero."},
 ["A","C","D"],"medium",["work-energy-theorem","spring-force","energy-conservation"],"fig-2023-q66"),

(67,"PHYS","P04",2,16,
 r"The potential energy of a particle in a field of force is equal to $A - Bx^{2}$ where $x$ is the displacement along a straight line from the equilibrium position. The force acting on the particle is",
 {"A":r"proportional to $x^{2}$.","B":r"proportional to $x$.","C":r"independent of $x$.","D":r"directed away from equilibrium position."},
 ["B","D"],"easy",["potential-energy","conservative-force","unstable-equilibrium"],None),

(68,"PHYS","E04",2,16,
 r"In the circuit shown, the capacitor is initially charged by a supply of emf $E$. The switch is closed at time $t = t_{0}$. Then which statement(s) is/are true ?",
 {"A":r"Immediately after switch on, the current in the circuit is $E/R$.","B":r"The current is maximum at time $t = \dfrac{1}{CR}$.","C":r"The current through the resistor decreases exponentially to zero.","D":r"The total heat energy dissipated across $R$ will be $\dfrac{1}{2}CE^{2}$."},
 ["A","C","D"],"medium",["rc-discharge","transient","joule-heating"],"fig-2023-q68"),

(69,"PHYS","E04",2,17,
 r"A solid non-conducting sphere of radius $R$ carries a non-uniform charge distribution with charge density $\rho = \rho_{0}\dfrac{r}{R}$ ($\rho_{0}$ = constant) and $r$ is the distance from the centre of the sphere. Then which of the following statement(s) is/are true ?",
 {"A":r"The total charge $Q$ on the sphere is $\pi\rho_{0}R^{3}$","B":r"The total charge $Q$ on the sphere is $\dfrac{4}{3}\pi\rho_{0}R^{3}$","C":r"The electric field inside the sphere is $\dfrac{1}{4\pi\varepsilon_{0}}\dfrac{Q}{R^{4}}r^{2}$","D":r"The electric field inside the sphere is $\dfrac{1}{4\pi\varepsilon_{0}}\dfrac{Q}{R^{3}}r^{2}$"},
 ["A","C"],"medium",["gauss-law","non-uniform-charge","electric-field"],None),

(70,"PHYS","P13",2,17,
 r"White light is used to illuminate the two slits in a Young’s double slit experiment. The separation between the slits is $b$ and the screen is at a distance $d$ $(d >> b)$ from the slits. $P$ is a point on the screen directly in front of $S_{1}$. Then which of the following statement(s) is/are true ?",
 {"A":r"On the screen, there will be coloured fringes except central fringe.","B":r"The path difference at point $P$ is $\left(d + \dfrac{b^{2}}{d}\right)$.","C":r"For destructive interference at point $P$, the condition will be $\left(n - \dfrac{1}{2}\right)\lambda = \dfrac{b^{2}}{2d}$, $(n = 1, 2, \ldots)$.","D":r"The $2^{\text{nd}}$ missing wavelength is $\dfrac{b^{2}}{3d}$"},
 ["A","C","D"],"medium",["youngs-double-slit","white-light","missing-wavelengths"],"fig-2023-q70"),

# ---------------- CHEMISTRY Cat-I (Q71-85) ----------------
# Q71–Q100: verbatim visual transcription from 180-DPI renders of the official Set A booklet
# (PDF pages 18–23, read with read_file before editing; figures cropped at 400 DPI).
# The booklet's symbol-font glyph "f" in Q82/Q88 is the equilibrium arrow (⇌), rendered as \rightleftharpoons.
# Key: JEEB/Reg-267/23 (03-08-2023), Series-A column. Q88 and Q94 are withdrawn (W).
(71,"CHEM","C01",1,18,
 r"If the ground state energy of H-atom is $-13.6$ eV, the energy of second excited state of $\text{Li}^{2+}$ ion will be",
 {"A":r"$-13.6$ eV","B":r"$-30.6$ eV","C":r"$-6.04$ eV","D":r"$+13.6$ eV"},
 ["A"],"medium",["bohr-model","hydrogen-like-ion","energy-levels"],None),

(72,"CHEM","C01",1,18,
 r"If the radius of second Bohr orbit of H atom is ‘$r_{2}$’, the radius of third Bohr orbit will be",
 {"A":r"$\dfrac{4}{9}r_{2}$","B":r"$4r_{2}$","C":r"$\dfrac{9}{4}r_{2}$","D":r"$9r_{2}$"},
 ["C"],"easy",["bohr-model","orbit-radius"],None),

(73,"CHEM","C01",1,18,
 r"In the ground state of $\text{Cu}^{+}$, the number of shells occupied, subshells, filled orbitals and unpaired electrons are respectively",
 {"A":r"4, 8, 15, 0","B":r"3, 6, 14, 0","C":r"3, 6, 15, 1","D":r"4, 7, 14, 2"},
 ["B"],"medium",["electronic-configuration","cu+","orbitals"],None),

(74,"CHEM","C04",1,18,
 r"How many electrons would be required to deposit 6.35 gm of copper at the cathode during the electrolysis of an aqueous solution of copper sulphate. Atomic mass of Cu = 63.5, $N_{A}$ = Avogadro’s no",
 {"A":r"$\dfrac{N_{A}}{20}$","B":r"$\dfrac{N_{A}}{10}$","C":r"$\dfrac{N_{A}}{5}$","D":r"$\dfrac{N_{A}}{2}$"},
 ["C"],"easy",["electrolysis","faraday-laws","mole-concept"],None),

(75,"CHEM","C01",1,19,
 r"The probability of finding electrons in $d_{yz}$ orbital is",
 {"A":r"along X and Z axis","B":r"along X and Y axis","C":r"along Y and Z axis","D":r"at an angle $45^{\circ}$ with Z axis"},
 ["D"],"medium",["d-orbitals","orbital-shape","angular-node"],None),

(76,"CHEM","C02",1,19,
 r"What is the correct order of bond dissociation energy among $\text{N}_{2}$, $\text{O}_{2}$ and $\text{O}_{2}^{-}$",
 {"A":r"$\text{N}_{2} > \text{O}_{2}^{-} > \text{O}_{2}$","B":r"$\text{O}_{2}^{-} > \text{O}_{2} > \text{N}_{2}$","C":r"$\text{N}_{2} > \text{O}_{2} > \text{O}_{2}^{-}$","D":r"$\text{O}_{2} > \text{O}_{2}^{-} > \text{N}_{2}$"},
 ["C"],"easy",["molecular-orbital-theory","bond-order","bond-energy"],None),

(77,"CHEM","C02",1,19,
 r"Equal number of $\sigma$ and $\pi$ bonds are present in",
 {"A":r"$\text{HCO}_{3}^{-}$","B":r"$\text{CH}_{2}(\text{CN})_{2}$","C":r"$(\text{CN})_{2}$","D":r"$\text{XeO}_{4}$"},
 ["D"],"medium",["sigma-pi-bonds","lewis-structure","xenon-compounds"],None),

(78,"CHEM","C03",1,19,
 r"How many litre(s) of water is to be added to 1 L of an aqueous solution of HCl with a pH 1 to produce an aqueous solution of pH 2 ?",
 {"A":r"10 L","B":r"1 L","C":r"9 L","D":r"20 L"},
 ["C"],"easy",["ph","dilution","strong-acid"],None),

(79,"CHEM","C03",1,19,
 r"$6.02 \times 10^{20}$ molecules of glucose are present in 100 ml of its solution. The concentration of the glucose solution will be",
 {"A":r"0.01 (M)","B":r"0.001 (M)","C":r"0.1 (M)","D":r"0.2 (M)"},
 ["A"],"easy",["mole-concept","molarity","avogadro-number"],None),

(80,"CHEM","C05",1,19,
 r"A given weak acid has its dissociation constant $k_{a} = 1.0 \times 10^{-5}$. Calculate the equilibrium constant when it reacts with a strong base.",
 {"A":r"$10^{5}$","B":r"$10^{10}$","C":r"$10^{9}$","D":r"$10^{17}$"},
 ["C"],"medium",["acid-base-equilibrium","ionic-product","neutralisation"],None),

(81,"CHEM","C02",1,20,
 r"The correct order of covalent character is :",
 {"A":r"$\text{LiCl} < \text{BeCl}_{2} < \text{BCl}_{3} > \text{CCl}_{4}$","B":r"$\text{LiCl} > \text{BeCl}_{2} > \text{BCl}_{3} > \text{CCl}_{4}$","C":r"$\text{LiCl} < \text{BeCl}_{2} < \text{BCl}_{3} < \text{CCl}_{4}$","D":r"$\text{LiCl} > \text{BeCl}_{2} < \text{BCl}_{3} < \text{CCl}_{4}$"},
 ["C"],"easy",["fajans-rules","polarising-power","covalent-character"],None),

(82,"CHEM","C05",1,20,
 r"The ratio of $\dfrac{K_{p}}{K_{c}}$ for the reaction, $\text{CO(g)} + \dfrac{1}{2}\text{O}_{2}\text{(g)} \rightleftharpoons \text{CO}_{2}\text{(g)}$ is",
 {"A":r"$\dfrac{1}{\sqrt{RT}}$","B":r"$(RT)^{1/2}$","C":r"$RT$","D":r"$1$"},
 ["A"],"easy",["kp-kc","gaseous-equilibrium","delta-n"],None),

(83,"CHEM","C02",1,20,
 r"Pair of species having identical shapes for molecules is",
 {"A":r"$\text{BF}_{3}$, $\text{PF}_{3}$","B":r"$\text{CF}_{4}$, $\text{SF}_{4}$","C":r"$\text{XeF}_{2}$, $\text{CO}_{2}$","D":r"$\text{PF}_{5}$, $\text{BrF}_{5}$"},
 ["C"],"easy",["vsepr","molecular-shape","lone-pairs"],None),

(84,"CHEM","C08",1,20,
 r"How many tertiary carbon atom(s) is/are present in the given compound ?",
 {"A":r"1","B":r"2","C":r"3","D":r"nil/absent"},
 ["A"],"easy",["carbon-classification","tertiary-carbon","structural-formula"],"fig-2023-q84"),

(85,"CHEM","C08",1,20,
 r"Among the following alcohols, which would react faster with conc. HCl and $\text{ZnCl}_{2}$ ?",
 {"A":r"pentanol","B":r"2 – methylbutanol","C":r"2 – pentanol","D":r"2 – methylbutan-2 – ol"},
 ["D"],"easy",["lucas-test","alcohols","carbocation-stability"],None),

# ---------------- CHEMISTRY Cat-II (Q86-90) ----------------
(86,"CHEM","C01",2,21,
 r"The Lyman Series for H atom corresponds to the transition, $n_{2} \rightarrow n_{1}$ when",
 {"A":r"$n_{2} = 2$, $n_{1} = 1$","B":r"$n_{2} = 3$, $n_{1} = 2$","C":r"$n_{2} = 4$, $n_{1} = 1$","D":r"$n_{2} = 4$, $n_{1} = 3$"},
 ["A","C"],"easy",["hydrogen-spectrum","lyman-series"],None),

(87,"CHEM","C01",2,21,
 r"The set of four quantum numbers of a single p electron having $n + 1 \leq 4$ may be",
 {"A":r"$\left(3, 1, +2, -\dfrac{1}{2}\right)$","B":r"$\left(2, 1, -1, +\dfrac{1}{2}\right)$","C":r"$\left(3, 1, 0, -\dfrac{1}{2}\right)$","D":r"$\left(2, 1, -2, +\dfrac{1}{2}\right)$"},
 ["B","C"],"medium",["quantum-numbers","p-electron","n-plus-l-rule"],None),

(88,"CHEM","C05",2,21,
 r"For the equilibrium $\text{H}_{2}\text{O (solid)} \rightleftharpoons \text{H}_{2}\text{O(liq.)}$ the correct statement is",
 {"A":r"If pressure of the system is increased, more ice will be melted to water.","B":r"Pressure has no effect upon the equilibrium.","C":r"If pressure increases, more ice will be formed.","D":r"Pressure can shorten the time to reach the equilibrium."},
 ["W"],"medium",["le-chatelier","phase-equilibrium","ice-water"],None),

(89,"CHEM","C06",2,21,
 r"Choose the correct reaction :",
 {"A":r"slag + flux = gangue","B":r"slag + gangue = flux","C":r"$\text{SiO}_{2} + \text{CaO} = \text{CaSiO}_{3}$","D":r"flux + gangue = slag"},
 ["C","D"],"easy",["metallurgy","flux","slag"],None),

(90,"CHEM","C03",2,21,
 r"Ethylenediaminetetraacetic acid can be an example of",
 {"A":r"Arrhenius acid","B":r"Bronsted acid","C":r"Lewis base","D":r"Arrhenius base"},
 ["A","B","C"],"medium",["acid-base-concepts","edta","lewis-base"],None),

# ---------------- FEEE Cat-I (Q91-100) ----------------
(91,"FEEE","E05",1,22,
 r"A current source $i(t)$ is applied to a series RLC circuit as shown in the figure. The maximum potential difference across the resistor is,",
 {"A":r"10 V","B":r"15 V","C":r"5 V","D":r"20 V"},
 ["B"],"easy",["rlc-circuit","current-source","ohms-law"],"fig-2023-q91"),

(92,"FEEE","E04",1,22,
 r"If $V_{1}$ and $V_{2}$ are the potential drops across the capacitors $C_{1}$ and $C_{2}$ respectively, then the correct values of $V_{1}$ and $V_{2}$ are,",
 {"A":r"$V_{1} = \dfrac{5}{3}$ V, $V_{2} = \dfrac{10}{3}$ V","B":r"$V_{1} = \dfrac{10}{3}$ V, $V_{2} = \dfrac{5}{3}$ V","C":r"$V_{1} = \dfrac{5}{2}$ V, $V_{2} = \dfrac{5}{2}$ V","D":r"$V_{1} = \dfrac{3}{5}$ V, $V_{2} = \dfrac{10}{3}$ V"},
 ["B"],"easy",["series-capacitors","charge-sharing","dc-circuits"],"fig-2023-q92"),

(93,"FEEE","E05",1,22,
 r"Find the r.m.s. value of $10 + 10\sin 100\pi t$ V.",
 {"A":r"12.25 V","B":r"7.07 V","C":r"22.75 V","D":r"70.71 V"},
 ["A"],"easy",["rms-value","dc-offset","sinusoid"],None),

(94,"FEEE","E04",1,22,
 r"In the circuit given, the voltage AB is",
 {"A":r"35 V","B":r"28.2 V","C":r"38.3 V","D":r"42.6 V"},
 ["W"],"medium",["millman-theorem","parallel-sources","dc-circuits"],"fig-2023-q94"),

(95,"FEEE","E04",1,23,
 r"Find the equivalent capacitance of the combination shown in the figure across X-Y.",
 {"A":r"$\dfrac{3}{4}\ \mu\text{F}$","B":r"$7\ \mu\text{F}$","C":r"$4\ \mu\text{F}$","D":r"$\dfrac{4}{3}\ \mu\text{F}$"},
 ["A"],"easy",["capacitor-network","series-parallel","equivalent-capacitance"],"fig-2023-q95"),

(96,"FEEE","E02",1,23,
 r"If the supply frequency of a transformer increases, the secondary output voltage of the transformer",
 {"A":r"increases","B":r"decreases","C":r"remains unchanged","D":r"follows the primary"},
 ["A"],"medium",["transformer","emf-equation","frequency"],None),

(97,"FEEE","E02",1,23,
 r"If a transformer is connected to a direct current supply, the result is",
 {"A":r"damage of the transformer","B":r"no effect","C":r"operation at low frequency","D":r"operation at higher frequency"},
 ["A"],"easy",["transformer","dc-supply","winding-resistance"],None),

(98,"FEEE","E03",1,23,
 r"A dc motor develops a torque of 120 Nm at 20 rps. At 30 rps, it will develop a torque of,",
 {"A":r"160 Nm","B":r"120 Nm","C":r"80 Nm","D":r"40 Nm"},
 ["C"],"easy",["dc-motor","torque-speed","constant-power"],None),

(99,"FEEE","E03",1,23,
 r"For a dc shunt motor, if the excitation is changed,",
 {"A":r"torque will remain constant.","B":r"torque will change but power will remain constant.","C":r"both torque and power will change.","D":r"torque, power and speed, all will change."},
 ["B"],"medium",["dc-shunt-motor","field-control","constant-power"],None),

(100,"FEEE","E05",1,23,
 r"The average power delivered to an impedance $(4 - j3)\ \Omega$ by a current $5\cos(100\pi + 100^{\circ})$ A is",
 {"A":r"442 W","B":r"50 W","C":r"62.5 W","D":r"125 W"},
 ["B"],"easy",["ac-power","complex-impedance","average-power"],None),
]

# Alt text for the printed stem figures (describes what the booklet draws; never states the answer).
STEM_FIGURE_ALT_2023 = {
    42: "Two graphs side by side. Left: x in m versus t in s, a straight line from the origin, ticks 1, 2 on the x axis and 1, 2, 3 on the t axis, with dashed guides from the point (2, 2). Right: y in m versus t in s, a curve rising from the origin, ticks 1, 4 on the y axis and 1, 2, 3 on the t axis, with dashed guides from the points (1, 1) and (2, 4)",
    48: "P–V diagram with pressure levels 3P, 2P and P marked by dashed lines. Point A at 3P; B at 2P and C at P lie on the same vertical line to the right. An arrow runs up from C to B, a curve from B to A with its arrow pointing towards A, and a steeper curve from C to A with its arrow pointing towards A",
    56: "A cylindrical conductor narrowing from a wide left section of diameter D1 carrying current I1 to a narrow right section of diameter D2 carrying current I2; current arrows point to the right",
    60: "Circuit: a 12 V cell on the left branch; the top wire runs through a 500 Ω resistor to a junction; resistor R goes from the junction down to the bottom wire; from the junction the top wire continues through galvanometer G to a 2 V cell on the right branch, which returns to the bottom wire",
    61: "Graph of Pr/E² (vertical axis) versus R/r (horizontal axis) from the origin O: the curve rises to a maximum at point M, marked by a dashed vertical line down to the R/r axis, then falls and levels off",
    66: "A block labelled 4 Kg on a horizontal floor, attached by a coiled spring to a vertical wall on the left; an arrow F pulls the block to the right",
    68: "Circuit loop: capacitor C on the left side, resistor R on the top wire, the right side a plain wire, and an open switch S on the bottom wire",
    70: "Young's double slit: a vertical barrier with slits S1 (upper) and S2 (lower) separated by b; a vertical screen at distance d; a dashed horizontal line from S1 to the point P on the screen, and a dashed slanted line from S2 to P",
    84: "Condensed structural formula drawn on one line: H3C–C–CH2–CH–CH3, with two CH3 groups on the second carbon (one drawn above, one below) and one CH3 group drawn above the fourth carbon (CH)",
    91: "Left: circuit in which a current source i(t), arrow pointing up, feeds a series loop through a 3 Ω resistor and a 2 mH inductor on the top wire and a 500 μF capacitor on the right side. Right: graph of i(t) against t (ms) with dashed levels at 5A and – 5A; i rises linearly from 0 at t = 0 to 5A at t = 1, stays at 5A until t = 2, falls linearly through 0 at t = 3 to – 5A at t = 4, stays at – 5A until t = 5 and rises back to 0 at t = 6; dashed verticals at t = 1, 2, 4 and 5",
    92: "Circuit loop: a 5 V source (+ on top) on the left side; capacitor C1 = 5 μF on the top wire; capacitor C2 = 10 μF on the right side; plain bottom wire",
    94: "Circuit between terminals A and B: three branches, each a cell in series with a resistor (50 V with 5 Ω, 40 V with 4 Ω, 30 V with 3 Ω, long cell plate towards the A side), stacked between a left and a right vertical wire; the A terminal wire runs into the middle (40 V) branch and the middle branch continues to B; a 2 Ω resistor on a bottom wire joins A directly to B",
    95: "Capacitor network from X to Y: a 2 μF capacitor on the upper path in parallel with two 2 μF capacitors in series on the lower path; this combination is followed by a 1 μF capacitor in series to Y",
}
