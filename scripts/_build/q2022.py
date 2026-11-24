# JELET 2022 Paper-I Set A — question data. Q1–Q40: verbatim visual transcription + verified-derived keys (Batch A);
# Q41–Q100: reconstructed OCR, derived keys (pending Batches B/C). Each entry: (qNumber, subjectId, unitId, category, pdfPage, stemLatex, {A,B,C,D: latex}, correct(list), difficulty, tags, figureKeyOrNone)

Q2022 = [
# ---------------- MATHEMATICS Cat-I (Q1-30) ----------------
# Q1–Q40 transcribed verbatim (visual read at 180 DPI) from the official JELET 2022 Paper-I Set-A booklet,
# PDF pages 3–10. Printed typos are preserved (e.g. Q16 "does not exists", Q34 "ellipse", Q37 "y/9", Q38
# "continuou"). Keys are verified-derived (no WBJEEB 2022 key is archived): every item is solved independently
# and re-derived by scripts/verify_solutions_sympy.py (_a22_qN). Q7 has no correct option -> W (owner decision).
(1,"MATH","M01",1,3,
 r"Let $A = \begin{pmatrix} 5 & 0 & 1 \\ 0 & -2 & 0 \\ 1 & 0 & 5 \end{pmatrix}$, $Q = \begin{pmatrix} 0 & \dfrac{1}{\sqrt{2}} & \dfrac{1}{\sqrt{2}} \\ -1 & 0 & 0 \\ 0 & -\dfrac{1}{\sqrt{2}} & \dfrac{1}{\sqrt{2}} \end{pmatrix}$. Then $Q^{T}AQ$ is",
 {"A":r"a diagonal matrix","B":r"not a diagonal matrix","C":r"an orthogonal matrix","D":r"a null matrix"},
 ["A"],"medium",["orthogonal-diagonalisation","eigenvectors","symmetric-matrix"],None),

(2,"MATH","M01",1,3,
 r"If $A = \begin{pmatrix} 2 & -1 \\ -1 & 2 \end{pmatrix}$ and $I$ is the unit matrix of order $2$ then $A^{2}$ equal to",
 {"A":r"$4A - 3I$","B":r"$3A - 4I$","C":r"$A - I$","D":r"$A + I$"},
 ["A"],"easy",["cayley-hamilton","matrix-square"],None),

(3,"MATH","M01",1,3,
 r"Let $A = \begin{pmatrix} 1 & 2 \\ 3 & 2 \end{pmatrix}$",
 {"A":r"$A$ is non-diagonalizable","B":r"$A$ is singular matrix","C":r"$A$ is diagonalizable","D":r"$A^{T}A = I_{2}$"},
 ["C"],"easy",["eigenvalues","diagonalisability"],None),

(4,"MATH","M01",1,3,
 r"Let $A = \begin{pmatrix} 1 & 0 & 0 \\ 1 & 0 & 1 \\ 0 & 1 & 0 \end{pmatrix}$, then $A^{3} - A^{2} - A + I_{3}$ ($I_{3}$ is the identity matrix of order $3$) is",
 {"A":r"Identity matrix of order $3$","B":r"null matrix of order $3$","C":r"non-null matrix of order $3$","D":r"$\begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 0 \end{pmatrix}$"},
 ["B"],"easy",["cayley-hamilton","characteristic-polynomial"],None),

(5,"MATH","M02",1,4,
 r"Let $\Delta = \begin{vmatrix} a & h & g \\ h & b & f \\ g & f & c \end{vmatrix}$, then Where $B$, $C$, $F$ are respectively the co-factors of $b$, $c$, $f$ to $\Delta$.",
 {"A":r"$\dfrac{BC - F^{2}}{a} = \Delta^{2}$","B":r"$\dfrac{BC - F^{2}}{a} = \Delta$","C":r"$\dfrac{BC - F^{2}}{a} = \dfrac{\Delta}{2}$","D":r"$\dfrac{BC - F^{2}}{a^{2}} = \Delta$"},
 ["B"],"hard",["cofactors","symmetric-determinant","adjoint"],None),

(6,"MATH","M02",1,4,
 r"If $\begin{vmatrix} a^{2} & -ab & -ac \\ -ab & b^{2} & -bc \\ ca & bc & -c^{2} \end{vmatrix} = Ka^{2}b^{2}c^{2}$, then $K =$",
 {"A":r"$1$","B":r"$2$","C":r"$3$","D":r"$4$"},
 ["D"],"medium",["determinant","factorisation"],None),

(7,"MATH","M03",1,4,
 r"Let $z = 1 + i\tan\dfrac{3\pi}{5}$,Then",
 {"A":r"$|z| = \sec\dfrac{3\pi}{5}$, $\arg z = \dfrac{3\pi}{5}$","B":r"$|z| = -\sec\dfrac{3\pi}{5}$, $\arg z = -\dfrac{7\pi}{5}$","C":r"$|z| = -\sec\dfrac{3\pi}{5}$, $\arg z = \dfrac{2\pi}{5}$","D":r"$|z| = \sec\dfrac{3\pi}{5}$, $\arg z = \dfrac{4\pi}{5}$"},
 ["W"],"medium",["modulus-argument","principal-argument","withdrawn"],None),

(8,"MATH","M03",1,4,
 r"If $iz^{3} + z^{2} - z + i = 0$, then $|z| =$",
 {"A":r"$1$","B":r"$\dfrac{1}{2}$","C":r"$2$","D":r"$\dfrac{1}{3}$"},
 ["A"],"medium",["complex-roots","factorisation","modulus"],None),

(9,"MATH","M04",1,4,
 r"The locus of the point which moves in such a way that the difference of its distance from the point $(3, 0)$ and $(9, 0)$ is $4$ units in a conic section whose eccentricity is",
 {"A":r"$2$","B":r"$\dfrac{5}{2}$","C":r"$\dfrac{3}{2}$","D":r"$\dfrac{4}{3}$"},
 ["C"],"easy",["hyperbola","focal-distance","eccentricity"],None),

(10,"MATH","M04",1,5,
 r"A triangle $ABC$ of area $\Delta$ is inscribed in the parabola $y^{2} = 4ax$ $(a > 0)$ such that the vertex of the parabola is at $A$, and the base $BC$ is a focal chord. The differences of ordinates of $B$ and $C$ is",
 {"A":r"$\dfrac{\Delta}{a}$","B":r"$\dfrac{2\Delta}{a}$","C":r"$\dfrac{\Delta}{2a}$","D":r"$\dfrac{3\Delta}{2a}$"},
 ["B"],"medium",["parabola","focal-chord","area-of-triangle"],None),

(11,"MATH","M04",1,5,
 r"Consider a branch of the hyperbola $x^{2} - 2y^{2} - 2\sqrt{2}\,x - 4\sqrt{2}\,y - 6 = 0$ with vertex $A$. Let $B$ be one of the end points of its latus rectum. If $c$ is the focus of the hyperbola, nearer to $A$, then, the area of the triangle $ABC$ is",
 {"A":r"$1 - \sqrt{\dfrac{2}{3}}$ sq. unit","B":r"$\sqrt{\dfrac{3}{2}} - 1$ sq. unit","C":r"$1 + \sqrt{\dfrac{2}{3}}$ sq. unit","D":r"$\sqrt{\dfrac{3}{2}} + 1$ sq. unit"},
 ["B"],"hard",["hyperbola","latus-rectum","completing-the-square"],None),

(12,"MATH","M05",1,5,
 r"If $\vec{\alpha} = \hat{i} + 2\hat{j} + 2\hat{k}$, $|\vec{\beta}| = 5$ and the angle between $\vec{\alpha}$ and $\vec{\beta}$ is $\dfrac{\pi}{6}$, then, the area of the triangle formed by $\vec{\alpha}$ and $\vec{\beta}$ as two sides is",
 {"A":r"$\dfrac{15}{4}$ sq. unit","B":r"$15$ sq. unit","C":r"$\dfrac{15\sqrt{3}}{4}$ sq. unit","D":r"$15\sqrt{3}$ sq. unit"},
 ["A"],"easy",["cross-product","area-of-triangle"],None),

(13,"MATH","M05",1,5,
 r"A force of magnitude $\sqrt{6}$ acting along the line joining the points $A\,(2, -1, 1)$ and $B\,(3, 1, 2)$ displaces a particle from $A$ to $B$. The work done by the force is",
 {"A":r"$\sqrt{6}$ unit","B":r"$6$ unit","C":r"$6\sqrt{6}$ unit","D":r"$36$ unit"},
 ["B"],"easy",["work-done","dot-product","unit-vector"],None),

(14,"MATH","M06",1,5,
 r"Let $f(x)$ be twice differentiable function such that $f''(x) = -f(x)$ and $f'(x) = g(x)$, $h(x) = [f(x)]^{2} + [g(x)]^{2}$. If $h(5) = 11$, then $h(10)$ is equal to",
 {"A":r"$22$","B":r"$0$","C":r"$11$","D":r"$4$"},
 ["C"],"easy",["derivative","constant-function","chain-rule"],None),

(15,"MATH","M06",1,6,
 r"The equation $10^{x} + 5^{x} = 8^{x} + 7^{x}$ has",
 {"A":r"no solution in $\mathbb{R}$","B":r"only solution at $x = 0$","C":r"has non-zero integral solution","D":r"all positive integers as solution"},
 ["C"],"medium",["exponential-equation","roots"],None),

(16,"MATH","M06",1,6,
 r"$\lim\limits_{x \to 0} \left(e^{x} + x\right)^{1/x}$",
 {"A":r"does not exists","B":r"is $0$","C":r"is $e^{2}$","D":r"is $e^{1/2}$"},
 ["C"],"easy",["limit","one-power-infinity","lhopital"],None),

(17,"MATH","M06",1,6,
 r"Consider the function $f(x) = |x|$, $x \in \mathbb{R}$. Then",
 {"A":r"Rolle's theorem is always applicable to $f$ in $[a, b]$ $(\subset \mathbb{R})$","B":r"Rolle's theorem is applicable to $f$ in $[a, b]$ when $0 < a < b$","C":r"Rolle's theorem is applicable to $f$ in $[a, b]$ if $a < b < 0$","D":r"Rolle's theorem is never applicable to $f$ in $[a, b]$"},
 ["D"],"medium",["rolle-theorem","modulus-function","differentiability"],None),

(18,"MATH","M06",1,6,
 r"On the curve $y = x^{3}$, consider the chord joining $A\,(-1, -1)$ and $B\,(2, 8)$. Then",
 {"A":r"$\exists$ a point on the curve at which the tg (tangent) is parallel to chord $AB$.","B":r"$\exists$ no point satisfying the stipulation mentioned in (A).","C":r"$\exists$ two points on the curve at which the tgs are parallel to chord $AB$.","D":r"tgs at every point on the curve is perpendicular to $AB$."},
 ["A"],"medium",["lagrange-mvt","tangent-slope"],None),

(19,"MATH","M07",1,6,
 r"A rectangle is inscribed in a right-angle triangle so as to have one angle coincident with the right angle. Then",
 {"A":r"the area is maximum when the opposite corner bisects the hypotenuse.","B":r"the area is maximum when the opposite corner intersects the hypotenuse in the ratio $2:1$.","C":r"the area is maximum when the opposite corner coincides with centroid of the triangle.","D":r"area is not maximum anywhere."},
 ["A"],"medium",["maxima-minima","optimisation"],None),

(20,"MATH","M04",1,6,
 r"The tangent at any point $P$ to the parabola $y^{2} = 4ax$ meets the directrix at the point $K$. Then the angle which $KP$ subtends at the focus is",
 {"A":r"$30^{\circ}$","B":r"$45^{\circ}$","C":r"$60^{\circ}$","D":r"$90^{\circ}$"},
 ["D"],"medium",["parabola","tangent","directrix"],None),

(21,"MATH","M07",1,7,
 r"A man of $2$ m height walks at a uniform speed of $6$ km/h, away from a lamp post of $6$ m high. The rate at which the length of his shadow increases is",
 {"A":r"$2$ km/h","B":r"$1$ km/h","C":r"$6$ km/h","D":r"$3$ km/h"},
 ["D"],"easy",["rate-of-change","similar-triangles"],None),

(22,"MATH","M08",1,7,
 r"If $u = \dfrac{x}{a} + f(ay - bx)$, then $a\dfrac{\partial u}{\partial x} + b\dfrac{\partial u}{\partial y}$ is",
 {"A":r"$a$","B":r"$1$","C":r"$b$","D":r"$a/b$"},
 ["B"],"easy",["partial-derivative","chain-rule"],None),

(23,"MATH","M08",1,7,
 r"Let $v(x, y) = \sin^{-1}\left(\sqrt{x^{2} + y^{2}}\right)$. Then $x\dfrac{\partial v}{\partial x} + y\dfrac{\partial v}{\partial y}$",
 {"A":r"does not exist","B":r"exists and is $0$","C":r"exists and is $\tan v$","D":r"exists and is $\cot v$"},
 ["C"],"medium",["euler-theorem","homogeneous-function","partial-derivative"],None),

(24,"MATH","M09",1,7,
 r"If $\displaystyle\int \dfrac{dx}{x^{n}(1 + x^{n})^{1/n}} = K\left(\dfrac{x^{n} + 1}{x^{n}}\right)^{\frac{n-1}{n}} + C$, where $C$ is an arbitrary constant, then $K =$",
 {"A":r"$\dfrac{1}{n}$","B":r"$-\dfrac{1}{n}$","C":r"$\dfrac{1}{n-1}$","D":r"$-\dfrac{1}{n-1}$"},
 ["D"],"medium",["substitution","indefinite-integral"],None),

(25,"MATH","M09",1,7,
 r"If $f(x) = |x^{2} - x| + |x - 2|$, then $\displaystyle\int_{0}^{3} f(x)\,dx =$",
 {"A":r"$\dfrac{21}{4}$","B":r"$\dfrac{19}{3}$","C":r"$\dfrac{26}{3}$","D":r"$\dfrac{22}{3}$"},
 ["D"],"medium",["definite-integral","modulus-function"],None),

(26,"MATH","M09",1,8,
 r"$I = \displaystyle\int \dfrac{dx}{\left(1 + \sqrt{x}\right)\left(\sqrt{x - x^{2}}\right)}$, then $I =$",
 {"A":r"$\dfrac{\sqrt{x} + 1}{\sqrt{x} - 1} + c$","B":r"$\dfrac{1 - \sqrt{x}}{1 + \sqrt{x}} + c$","C":r"$\dfrac{2\left(\sqrt{x} - 1\right)}{\sqrt{(1 - x)}} + c$","D":r"$\dfrac{2\left(\sqrt{1 + x)}\right)}{\sqrt{(1 - x)}} + c$"},
 ["C"],"hard",["substitution","indefinite-integral","differentiate-options"],None),

(27,"MATH","M10",1,8,
 r"The equation of curve passing through the point $\left(1, \dfrac{\pi}{4}\right)$ and having slope at tangent at any point $(x, y)$ as $\dfrac{y}{x} - \cos^{2}\left(\dfrac{y}{x}\right)$ is",
 {"A":r"$x = e^{1 + \tan\left(\frac{y}{x}\right)}$","B":r"$x = e^{1 - \tan\left(\frac{y}{x}\right)}$","C":r"$x = e^{1 + \tan\left(\frac{x}{y}\right)}$","D":r"$x = e^{1 - \tan\left(\frac{x}{y}\right)}$"},
 ["B"],"medium",["homogeneous-ode","initial-value"],None),

(28,"MATH","M10",1,8,
 r"$\dfrac{d^{2}y}{dx^{2}} + 2\dfrac{dy}{dx} + y = 2e^{2x}$, then",
 {"A":r"$y = c_{1}e^{x} + c_{2}e^{-x} + e^{2x}$","B":r"$y = (A + Bx)e^{-x} + \dfrac{1}{9}e^{2x}$","C":r"$y = (A + Bx)e^{-x} + \dfrac{2}{9}e^{2x}$","D":r"$y = A\cos x + B\sin x + \dfrac{e^{2x}}{9}$"},
 ["C"],"easy",["linear-ode-constant-coefficients","particular-integral"],None),

(29,"MATH","M11",1,8,
 r"The digits $1, 2, 3, \ldots, 9$ are written in random order to form a nine digit number. The probability that this number is divisible by $36$ is",
 {"A":r"$\dfrac{2}{9}$","B":r"$\dfrac{1}{9}$","C":r"$\dfrac{1}{3}$","D":r"$\dfrac{4}{9}$"},
 ["A"],"medium",["divisibility","permutations","classical-probability"],None),

(30,"MATH","M11",1,8,
 r"The probability that at least one of $A$ and $B$ occurs is $0.6$. If $A$ and $B$ occurs simultaneously with probability $0.3$, then $P(A') + P(B')$ is",
 {"A":r"$0.9$","B":r"$0.15$","C":r"$1.1$","D":r"$1.2$"},
 ["C"],"easy",["addition-theorem","complement"],None),

# ---------------- MATHEMATICS Cat-II (Q31-40) ----------------
(31,"MATH","M01",2,9,
 r"Let $A = \begin{pmatrix} \lambda & 1 & 0 \\ 3 & \lambda - 2 & 1 \\ 3(\lambda + 1) & 0 & \lambda + 1 \end{pmatrix}$. Rank of $A$ is",
 {"A":r"$2$ for $\lambda = 0$","B":r"$3$ for $\lambda \neq 0, 2, -1$","C":r"$3$ for $\lambda = 2$","D":r"$3$ for $\lambda = -1$"},
 ["A","B"],"medium",["rank","determinant","parameter"],None),

(32,"MATH","M02",2,9,
 r"Under which of the following conditions the system of equations $ax + by + cz = 0$, $bx + cy + az = 0$, $cx + ay + bz = 0$ have a non-zero solution ?",
 {"A":r"$a + b + c = 0$","B":r"$a = b = c$","C":r"$abc = 1$","D":r"$a^{2} + b^{2} + c^{2} = 0$"},
 ["A","B"],"medium",["homogeneous-system","circulant-determinant","interpretation-note"],None),

(33,"MATH","M03",2,9,
 r"If $2\cos\theta = x + \dfrac{1}{x}$ and $2\cos\phi = y + \dfrac{1}{y}$, then",
 {"A":r"$\dfrac{x}{y} + \dfrac{y}{x} = 2\cos(\theta - \phi)$","B":r"$\dfrac{x}{y} + \dfrac{y}{x} = \cos(\theta + \phi)$","C":r"$xy + \dfrac{1}{xy} = 2\cos(\theta + \phi)$","D":r"$xy + \dfrac{1}{xy} = 2\cos(\theta - \phi)$"},
 ["A","C"],"medium",["de-moivre","cis-form","interpretation-note"],None),

(34,"MATH","M04",2,9,
 r"If the latus rectum of the hyperbola $\dfrac{x^{2}}{a^{2}} - \dfrac{y^{2}}{b^{2}} = 1$ subtend a right angle at the centre of the hyperbola, then eccentricity of the ellipse is",
 {"A":r"$\dfrac{\sqrt{5} + 1}{2}$","B":r"$\dfrac{\sqrt{5} + 2}{2}$","C":r"less than $2$","D":r"greater than $2$"},
 ["A","C"],"medium",["hyperbola","latus-rectum","eccentricity","misprint"],None),

(35,"MATH","M05",2,9,
 r"The vector $\vec{a} \times \left(\vec{b} \times \vec{c}\right)$ is",
 {"A":r"coplanar with $\vec{a}$ and $\vec{b}$","B":r"coplanar with $\vec{b}$ and $\vec{c}$","C":r"perpendicular to $\vec{a}$","D":r"perpendicular to $\vec{c}$"},
 ["B","C"],"easy",["vector-triple-product","bac-cab"],None),

(36,"MATH","M06",2,10,
 r"If $x + |y| = 2y$, then $y$ as a function of $x$ is",
 {"A":r"defined for all real $x$","B":r"continuous at $x = 0$","C":r"differentiable for all $x$","D":r"such that $\dfrac{dy}{dx} = \dfrac{1}{3}$ for $x < 0$"},
 ["A","B","D"],"medium",["piecewise-function","continuity","differentiability"],None),

(37,"MATH","M04",2,10,
 r"The equation (s) of the tangents to the ellipse $\dfrac{x^{2}}{16} + \dfrac{y}{9} = 1$ parallel to the line $y = x$ is (are)",
 {"A":r"$y = x + 5$","B":r"$y = x + 3$","C":r"$y = x - 3$","D":r"$y = x - 5$"},
 ["A","D"],"easy",["ellipse","tangent-condition","misprint"],None),

(38,"MATH","M08",2,10,
 r"Let $f(x, y) = \begin{cases} \dfrac{xy^{2} + x^{2}y}{x^{2} + y^{2}}, & x^{2} + y^{2} \neq 0 \\ 0, & x^{2} + y^{2} = 0 \end{cases}$",
 {"A":r"neither $f_{x}$ nor $f_{y}$ exists at $(0, 0)$ but $f$ is continuous at $(0, 0)$","B":r"$f_{x}(0, 0) = 1$ but $f_{y}$ does not exist at $(0, 0)$","C":r"$f$ is continuou at $(0, 0)$","D":r"$f_{x}$, $f_{y}$ exist at $(0, 0)$ and both are $0$"},
 ["C","D"],"medium",["partial-derivative","continuity-two-variables"],None),

(39,"MATH","M09",2,10,
 r"If $\displaystyle\int \dfrac{\sin x + \cos x}{\sqrt{\sin x\cos x}}\,dx = f(x) + c$, then $f(x)$ equals",
 {"A":r"$\sqrt{2}\,\sin^{-1}(\sin x - \cos x)$","B":r"$-\sqrt{2}\,\cos^{-1}(\sin x - \cos x)$","C":r"$\sin^{-1}(\sin x - \cos x)$","D":r"$\cos^{-1}(\sin x - \cos x)$"},
 ["A","B"],"medium",["substitution","antiderivative-up-to-constant"],None),

(40,"MATH","M10",2,10,
 r"If $x\,dy = y(dx + y\,dy)$, $y(1) = 1$, then $y(-3)$ is",
 {"A":r"$3$","B":r"$2$","C":r"$-1$","D":r"$4$"},
 ["A","C"],"medium",["exact-differential","initial-value","implicit-solution"],None),

# ---------------- PHYSICS Cat-I (Q41-65) ----------------
(41,"PHYS","P02",1,11,
 "The equation of a wave is given by $y = A\\sin(\\omega t - kx)$ where the symbols $A$, $\\omega$ and $k$ have their usual meanings. The dimension of $p$ and $q$ in $y = A\\sin(pt - qx)$ are respectively",
 {"A":"$L, T^{-1}$","B":"$L^{-1}, T$","C":"$L, T$","D":"dimensionless, $T^{-1}$"},
 ["A"],"easy",["dimensions","waves","dimensional-analysis"],None),

(42,"PHYS","P02",1,11,
 "The length, breadth and thickness of a strip are given by $L = (10.0 \\pm 0.1)\\,\\text{cm}$, $h = (1.00 \\pm 0.01)\\,\\text{cm}$, $t = (0.1 \\pm 0.001)\\,\\text{cm}$. The most probable error in volume will be",
 {"A":"$0.03\\,\\text{cm}^{3}$","B":"$0.111\\,\\text{cm}^{3}$","C":"$0.012\\,\\text{cm}^{3}$","D":"$0.12\\,\\text{cm}^{3}$"},
 ["A"],"medium",["errors","error-analysis","volume"],"fig-2022-q42"),

(43,"PHYS","P02",1,11,
 "The area of the triangle having vertices at $P(1, 3, 2)$, $Q(2, -1, 1)$ and $R(-1, 2, 3)$ will be",
 {"A":"$\\dfrac{\\sqrt{107}}{2}$ sq. unit","B":"$\\sqrt{107}$ sq. unit","C":"$3\\sqrt{2}$ sq. unit","D":"$\\dfrac{2}{\\sqrt{107}}$ sq. unit"},
 ["A"],"medium",["vector-algebra","cross-product","area"],None),

(44,"PHYS","P02",1,11,
 "The kinetic energy of a particle moving along a circle of radius $R$ is $ax$ where $\\alpha$ is a constant and $x$ is the distance covered. The force acting in the radial direction is proportional to",
 {"A":"$\\dfrac{1}{x}$","B":"$\\dfrac{1}{x^{2}}$","C":"$x$","D":"independent of $x$"},
 ["C"],"hard",["rotation","force","centripetal"],None),

(45,"PHYS","P02",1,11,
 "The trajectory of a point particle in a projectile motion is given by the equation $y = 2x - 5x^{2}$, where $y$ is height and $x$ is horizontal distance. With what velocity was the particle projected? ($g = -10\\,\\text{m/s}^{2}$)",
 {"A":"$\\hat{i} + \\hat{j}\\,\\text{m/s}$","B":"$2\\hat{i} + \\hat{j}\\,\\text{m/s}$","C":"$\\hat{i} + 2\\hat{j}\\,\\text{m/s}$","D":"$3\\hat{i} + \\hat{j}\\,\\text{m/s}$"},
 ["C"],"hard",["kinematics","projectile","trajectory"],None),

(46,"PHYS","P03",1,12,
 "A constant force $F$ is applied to the block of mass $m$ connected to the spring of spring constant $k$ as shown in figure. Initially ($t = 0$), the block is at rest. The amplitude of oscillation of $m$ will be",
 {"A":"$\\dfrac{F}{k}$","B":"$\\dfrac{F}{m\\omega}$","C":"$\\dfrac{F}{m\\omega^{2}}$","D":"$\\dfrac{F}{m\\omega}$"},
 ["A"],"medium",["spring","oscillation","amplitude"],"fig-2022-q46"),

(47,"PHYS","P03",1,12,
 "A block of mass $1.0\\,\\text{kg}$ moving on a smooth horizontal surface with speed $2\\,\\text{m/s}$ enters a rough surface. The retarding force $(F)$ on the block is given by $F = \\dfrac{k}{x}$; $10\\,\\text{m} < x < 100\\,\\text{m}$, where $k = 0.5\\,\\text{J}$. The kinetic energy of the block at $x = 100\\,\\text{m}$ will be (given, $\\ln 10 = 2.3$)",
 {"A":"$2\\,\\text{J}$","B":"$0$","C":"$1.15\\,\\text{J}$","D":"$0.85\\,\\text{J}$"},
 ["D"],"hard",["work-energy","force","integration"],None),

(48,"PHYS","P03",1,12,
 "A uniform disc of mass $M$ and radius $R$ can rotate in vertical plane about its horizontal axis. A point mass $m$ is glued to the disc at point $P$, as shown in figure. If the system is released from rest, the angular velocity of the disc when the point mass reaches the bottom most point $P_{2}$ is",
 {"A":"$\\sqrt{\\dfrac{4mg}{(2M+m)R}}$ rad/sec","B":"$\\sqrt{\\dfrac{4mg}{(m+M)R}}$ rad/sec","C":"$\\sqrt{\\dfrac{4mg}{(2m+M)R}}$ rad/sec","D":"$\\sqrt{\\dfrac{4mg}{(M+m)R}}$ rad/sec"},
 ["A"],"hard",["rotation","energy-conservation","angular-velocity"],"fig-2022-q48"),

(49,"PHYS","P03",1,13,
 "Two identical point masses are placed on $y$ axis at $y = a$ and $y = -a$. The variation of the magnitude of the gravitational potential $|V(x)|$ as a function of $x$ is given by",
 {"A":"graph A","B":"graph B","C":"graph C","D":"graph D"},
 ["B"],"medium",["gravitation","potential","graph"],"fig-2022-q49"),

(50,"PHYS","P08",1,13,
 "If the change in volume is $0.4\\%$ due to a change in length is $1\\%$ when a stress is applied along the length of the rod, the Poisson ratio of the material is",
 {"A":"$0.3$","B":"$0.6$","C":"$0.8$","D":"cannot be determined"},
 ["A"],"medium",["elasticity","poisson-ratio","stress-strain"],None),

(51,"PHYS","P08",1,13,
 "A large open tank has two holes in the wall. One is a square hole of side $L$ at a depth $y$ and the other is a circular hole of radius $R$ at a depth $2y$. If the rate of water flow through both the holes are equal, then $R$ is equal to",
 {"A":"$\\dfrac{L}{\\sqrt{2\\pi}}$","B":"$\\dfrac{L}{2\\pi}$","C":"$\\dfrac{L}{\\pi}$","D":"$\\dfrac{L}{24\\pi}$"},
 ["A"],"hard",["fluid","torricelli","flow-rate"],None),

(52,"PHYS","P03",1,13,
 "A small sphere falls from rest in a viscous liquid. Heat is produced during its fall due to friction with the liquid. If $R$ be the radius of the sphere, then the rate of production of heat at terminal velocity is",
 {"A":"proportional to $R^{2}$","B":"proportional to $R^{5}$","C":"proportional to $R^{3}$","D":"independent of $R$"},
 ["B"],"hard",["fluid","viscosity","terminal-velocity"],None),

(53,"PHYS","P11",1,13,
 "A well lagged wire of length $L$ and cross-sectional area $S$ has its ends maintained at temperatures $T_{1}$ and $T_{2}$. The thermal conductivity of the wire is given by $K = \\beta + T$ where $T$ is the temperature and $\\beta$ and $\\gamma$ are constants. Then the rate of flow of heat along the wire is equal to",
 {"A":"$\\dfrac{S\\beta}{L}(T_{1}-T_{2})$ if $\\gamma = 0$","B":"$\\dfrac{S\\gamma}{L}(T_{1}+T_{2})$ if $\\beta = 0$","C":"$\\dfrac{S\\beta}{L}(T_{1}-T_{2})$ if $\\gamma = 0, \\beta = 0$","D":"$\\dfrac{S\\gamma}{L}(T_{1}+T_{2})$ if $\\beta = 0$"},
 ["A"],"hard",["thermodynamics","heat-conduction","conductivity"],None),

(54,"PHYS","P11",1,13,
 "A one litre glass flask contains some mercury. It is found that at different temperatures, the volume of air in the empty space in the flask remains the same. What is the volume of mercury in the flask? (The co-efficient of linear expansion of glass is $9 \\times 10^{-6}\\,^{\\circ}\\text{C}^{-1}$ and the volume expansion of mercury is $1.8 \\times 10^{-4}\\,^{\\circ}\\text{C}^{-1}$)",
 {"A":"$50\\,\\text{cm}^{3}$","B":"$150\\,\\text{cm}^{3}$","C":"$450\\,\\text{cm}^{3}$","D":"$400\\,\\text{cm}^{3}$"},
 ["B"],"medium",["thermal-expansion","expansion","volume"],None),

(55,"PHYS","P11",1,14,
 "Consider an isobaric process of a monoatomic gas as shown in figure. The ratio of work done by the gas to the heat absorbed by it, when it undergoes a change from state $A$ to state $B$ is",
 {"A":"$\\dfrac{2}{5}$","B":"$\\dfrac{1}{5}$","C":"$\\dfrac{3}{5}$","D":"$\\dfrac{1}{3}$"},
 ["A"],"medium",["thermodynamics","isobaric","work-heat"],"fig-2022-q55"),

(56,"PHYS","P13",1,14,
 "The angle of prism and refractive index of its material are $A$ and $\\cot\\dfrac{A}{2}$. Then $\\cos\\delta_{m}$ is ($\\delta_{m}$ : angle of minimum deviation) ($A < \\pi/2$)",
 {"A":"$\\sin 2A$","B":"$\\cos 2A$","C":"$-\\cos 2A$","D":"$\\sin A$"},
 ["C"],"hard",["refraction","prism","minimum-deviation"],None),

(57,"PHYS","P13",1,14,
 "A vessel of height $H$ contains a liquid of refractive index $\\mu$. A spot $P$ at the bottom of the vessel creates an image $P'$ at a distance $d$ from the top of the vessel when viewed from the top. The liquid gradually drains out from a hole at the bottom. If $x$ represents the height of the water from the bottom at any instant, then the graph $d$ versus $x$ will be like",
 {"A":"graph A","B":"graph B","C":"graph C","D":"graph D"},
 ["B"],"medium",["refraction","apparent-depth","graph"],"fig-2022-q57"),

(58,"PHYS","P14",1,15,
 "A point source of monochromatic light $S$ is kept at the centre of the bottom of a cylinder of radius $15\\,\\text{cm}$. The cylinder contains liquid of refractive index $\\mu$ to a height of $7.0\\,\\text{cm}$. If the area of liquid surface through which the light emerges in air is $200\\,\\text{cm}^{2}$, then $\\mu^{2}$ equals to",
 {"A":"$0.23$","B":"$1.77$","C":"$1.33$","D":"$1.5$"},
 ["B"],"hard",["refraction","total-internal-reflection","critical-angle"],None),

(59,"PHYS","P14",1,15,
 "A thin biconvex lens of radius $10\\,\\text{cm}$ and index $\\dfrac{3}{2}$ is placed on a horizontal plane mirror. The space between the lens and the mirror is filled with a liquid of refractive index $\\mu$. If the system has a focal length of $25\\,\\text{cm}$, then $\\mu$ equals to",
 {"A":"$1.0$","B":"$1.5$","C":"$1.6$","D":"$1.3$"},
 ["C"],"hard",["lens","mirror","liquid-lens"],None),

(60,"PHYS","P15",1,15,
 "Given that a photon of light of wavelength $10,000\\,\\text{\\AA}$ has an energy equal to $1.243\\,\\text{eV}$. When light of wavelength $5000\\,\\text{\\AA}$ and intensity $I_{0}$ falls on a photo electric cell, the surface current is $0.4\\,\\mu\\text{A}$ and the stopping potential is $1.36\\,\\text{V}$. Then the work function is approximately",
 {"A":"$0.43\\,\\text{eV}$","B":"$1.54\\,\\text{eV}$","C":"$0.57\\,\\text{eV}$","D":"$1.12\\,\\text{eV}$"},
 ["D"],"hard",["photoelectric","work-function","stopping-potential"],None),

(61,"PHYS","P03",1,15,
 "A and B are two identical balls. Ball A moving with a speed of $6\\,\\text{m/s}$ along the positive $x$ axis collides with ball B at rest. After collision each ball moves making a direction $30^{\\circ}$ with $x$ axis. Then,",
 {"A":"Speed of ball A after collision is $\\sqrt{3}\\,\\text{m/s}$","B":"Speed of ball B after collision is $\\sqrt{3}\\,\\text{m/s}$","C":"Collision is not perfectly elastic","D":"Kinetic energy is conserved in collision"},
 ["C"],"hard",["collision","elastic","momentum-conservation"],None),

(62,"PHYS","P11",1,16,
 "A cyclic process $ABCA$, shown in $V$-$T$ diagram, is performed with a constant mass of an ideal gas. Which of the following graphs represents the corresponding process on a $P$-$V$ diagram?",
 {"A":"graph A","B":"graph B","C":"graph C","D":"graph D"},
 ["B"],"medium",["thermodynamics","pv-diagram","cycle"],"fig-2022-q62"),

(63,"PHYS","P08",1,16,
 "A piece of ice floats in a liquid of density $\\rho_{L}$. Density of water is $\\rho_{W}$ and $\\rho_{L} \\neq \\rho_{W}$. When the ice melts completely, the level of liquid",
 {"A":"will rise if $\\rho_{L} < \\rho_{W}$","B":"will rise if $\\rho_{L} > \\rho_{W}$","C":"will fall if $\\rho_{L} > \\rho_{W}$","D":"level remains unchanged"},
 ["B"],"medium",["fluid","buoyancy","density"],None),

(64,"PHYS","P15",1,16,
 "Two spherical planets $P$ and $Q$ have masses $M_{P}$ and $M_{Q}$, surface areas $A$ and $4A$ respectively and same uniform density $\\rho$. A spherical planet $W$ also has uniform density $\\rho$ and its mass is $(M_{P} + M_{Q})$. The escape velocities from the planets $P$, $Q$ and $W$ are $V_{P}$, $V_{Q}$ and $V_{W}$ respectively. Then",
 {"A":"$V_{P} + V_{Q} = V_{W}$","B":"$V_{P} + V_{Q} > V_{W}$","C":"$V_{P} + V_{Q} < V_{W}$","D":"$V_{P} = V_{Q} = V_{W}$"},
 ["B"],"hard",["gravitation","escape-velocity","density"],None),

(65,"PHYS","P11",1,16,
 "A rod of length $1000\\,\\text{mm}$ and co-efficient of linear expansion $\\alpha = 10^{-4}\\,^{\\circ}\\text{C}^{-1}$ is placed symmetrically between fixed walls separated by $1001\\,\\text{mm}$. The Young's modulus of the rod is $10^{11}\\,\\text{N/m}^{2}$. If the temperature is increased by $30^{\\circ}\\text{C}$, then the stress developed in the rod is",
 {"A":"$10^{8}\\,\\text{Pa}$","B":"$2 \\times 10^{8}\\,\\text{Pa}$","C":"$3 \\times 10^{8}\\,\\text{Pa}$","D":"$4 \\times 10^{8}\\,\\text{Pa}$"},
 ["B"],"hard",["elasticity","thermal-stress","young-modulus"],None),

# ---------------- PHYSICS Cat-II (Q66-70) ----------------
(66,"PHYS","P11",2,17,
 "A closed container of fixed volume has a mixture of one mole of hydrogen and one mole of helium in equilibrium at temperature $T$. Assume the gases are ideal. Which of the following statement(s) is/are true?",
 {"A":"The average energy per mole of the mixture is $\\dfrac{3}{2}RT$","B":"Average energy per mole of the gas mixture is $2RT$","C":"Degree of freedom of the gas mixture is $5$","D":"The ratio of rms speed of the Helium molecules to that of hydrogen molecules is $1:\\sqrt{2}$"},
 ["B","D"],"hard",["kinetic-theory","degrees-of-freedom","rms-speed"],None),

(67,"PHYS","P03",2,17,
 "A particle of mass $m$ moves rectilinearly under the force $F = A - Bx$ where $A > 0$, $B > 0$ and $x$ is the distance from the point where the particle was initially at rest. If $d$ is the distance travelled by the particle till it comes to rest, then which of the following statement(s) is/are true?",
 {"A":"$d = \\dfrac{2A}{B}$","B":"acceleration of the particle at $d$ is $-\\dfrac{A}{m}$","C":"Speed of the particle at a distance $x = \\dfrac{A}{B}$ is $\\dfrac{A}{\\sqrt{mB}}$","D":"acceleration vs $x$ graph is a straight line with slope $A/B$"},
 ["A","B"],"hard",["work-energy","force","acceleration"],None),

(68,"PHYS","P04",2,18,
 "A stone of mass $m$ travels with a uniform speed $v_{0}$ perpendicular to a stick of mass $m$ and length $L$ at rest. The stone collides elastically with the stick at a distance $h$ from its centre of mass. The stone and the stick move with equal speed after collision. Assume that stone moves in the same direction after collision. Then which of the following statement(s) is/are true?",
 {"A":"The speed of the stick after collision is $\\dfrac{v_{0}}{2}$","B":"The angular velocity of the stick is $\\dfrac{\\sqrt{6}v_{0}}{L}$","C":"Angular momentum is not conserved in this process","D":"The speed of the stone after collision is $v_{0}$"},
 ["A","B"],"hard",["collision","angular-momentum","elastic"],"fig-2022-q68"),

(69,"PHYS","P14",2,18,
 "A biconvex lens of focal length $15\\,\\text{cm}$ is placed $10\\,\\text{cm}$ in front of a plane mirror. A small object $O$ is kept at a distance of $30\\,\\text{cm}$ in front of the lens as shown in the figure. Then which of the following statement(s) is/are true?",
 {"A":"The second image $I_{2}$ will be formed at a distance $10\\,\\text{cm}$ to the left of the lens.","B":"The final image at $I_{P}$ is at a distance $16\\,\\text{cm}$ from mirror.","C":"The first image $I_{1}$ will behave as a virtual object for mirror.","D":"The final image is real."},
 ["A","B"],"hard",["lens","mirror","image-formation"],"fig-2022-q69"),

(70,"PHYS","P15",2,18,
 "Two monochromatic radiations, blue and violet of same intensity are incident on a photosensitive surface and cause photoelectric emission. If $n_{b}$ and $n_{v}$ represent frequencies of blue light and violet light respectively then",
 {"A":"$n_{b} > n_{v}$","B":"Number of electrons emitted per second by the blue light will be more than that by the violet light.","C":"Maximum kinetic energy of ejected electrons will be more for blue light.","D":"Work function of the material is different for blue and violet light."},
 ["B"],"medium",["photoelectric","frequency","intensity"],None),

# ---------------- CHEMISTRY Cat-I (Q71-85) ----------------
(71,"CHEM","C03",1,19,
 "Let $x$ ml of a solution of a substance $A$ reacts with $y$ ml of a solution of a substance $B$ according to the reaction $2A + 3B \\rightarrow \\text{products}$. If molar concentrations of the solutions of $A$ and $B$ are $M_{1}$ and $M_{2}$ respectively, then",
 {"A":"$2xM_{1} = 3yM_{2}$","B":"$3xM_{1} = 2yM_{2}$","C":"$2xM_{2} = 3yM_{1}$","D":"$3xM_{2} = 2yM_{1}$"},
 ["B"],"medium",["stoichiometry","concentration","reactions"],None),

(72,"CHEM","C03",1,19,
 "If the density of a solution of a substance is $z\\,\\text{gcm}^{-3}$ and gram molecular mass of the substance is $y\\,\\text{g}$, then the molality of the $x$ ($M$) solution is",
 {"A":"$\\dfrac{x}{z - 0.001xy}$","B":"$\\dfrac{x}{z - xy}$","C":"$\\dfrac{0.01x}{z - xy}$","D":"$\\dfrac{1000x}{1000z - xy}$"},
 ["D"],"hard",["solutions","molality","density"],None),

(73,"CHEM","C01",1,19,
 "If an electron is passed through a potential difference of $V$ volts, then de Broglie wavelength of the moving electron is [ $h$ = Planck's constant, $m$ = mass of electron, $e$ = charge of an electron]",
 {"A":"$\\dfrac{h}{\\sqrt{2meV}}$","B":"$\\dfrac{h}{\\sqrt{meV}}$","C":"$\\dfrac{h}{\\sqrt{mveV}}$","D":"$\\dfrac{h}{\\sqrt{m}}$"},
 ["A"],"medium",["atomic-structure","de-broglie","wavelength"],None),

(74,"CHEM","C01",1,19,
 "Electronic configuration of $\\text{Cu}^{+}$ is (Atomic number of Cu is $29$)",
 {"A":"$[\\text{Ar}]3d^{8}4s^{2}$","B":"$[\\text{Ar}]3d^{9}4s^{1}$","C":"$[\\text{Ar}]3d^{10}$","D":"$1s^{2}2s^{2}2p^{6}3s^{2}3p^{6}3d^{10}4s^{1}$"},
 ["C"],"easy",["atomic-structure","electronic-configuration","cu+"],None),

(75,"CHEM","C04",1,19,
 "A strong electrolyte $M_{\\nu_{+}}A_{\\nu_{-}}$ yielding the ions $M^{z+}$ and $A^{z-}$ in solution, the relation between equivalent conductivity ($\\Lambda_{eq}$) and molar conductivity ($\\Lambda_{m}$) is",
 {"A":"$\\Lambda_{eq} = \\dfrac{\\Lambda_{m}}{\\nu_{+} + \\nu_{-}}$","B":"$\\Lambda_{eq} = \\dfrac{\\Lambda_{m}}{\\nu_{+} + \\nu_{-}}$","C":"$\\Lambda_{eq} = \\Lambda_{m}(\\nu_{+} + \\nu_{-})$","D":"$\\Lambda_{eq} = \\dfrac{\\nu_{+}\\Lambda_{m}}{\\nu_{+} + \\nu_{-}}$"},
 ["A"],"medium",["electrochemistry","conductivity","electrolytes"],None),

(76,"CHEM","C05",1,20,
 "At a definite temperature the molar concentrations of two monobasic acids $HA$ and $HA'$ in their individual solutions are same. At that temperature if ionization constants of the acids are $K_{a}$ and $K_{a}'$ and $\\alpha$ and $\\alpha'$ are the degrees of ionization respectively, then",
 {"A":"$\\dfrac{K_{a}}{\\alpha} = \\dfrac{K_{a}'}{\\alpha'}$","B":"$\\dfrac{K_{a}}{\\alpha'} = \\dfrac{K_{a}'}{\\alpha}$","C":"$\\dfrac{K_{a}K_{a}'}{\\alpha} = \\dfrac{\\alpha'}{1}$","D":"$\\dfrac{K_{a}}{\\alpha'} = \\dfrac{K_{a}'}{\\alpha'}$"},
 ["A"],"hard",["equilibrium","ionization","acids"],None),

(77,"CHEM","C01",1,20,
 "To which of the following ions, Bohr model is applicable?",
 {"A":"$\\text{H}^{+}$","B":"$\\text{Li}^{+}$","C":"$\\text{Li}^{2+}$","D":"$\\text{He}^{2+}$"},
 ["C","D"],"medium",["atomic-structure","bohr-model","hydrogen-like"],None),

(78,"CHEM","C06",1,20,
 "The metal hydroxide that dissolves both in aqueous $\\text{KOH}$ and ammonia, is:",
 {"A":"$\\text{Be(OH)}_{2}$","B":"$\\text{Mg(OH)}_{2}$","C":"$\\text{Al(OH)}_{3}$","D":"$\\text{Zn(OH)}_{2}$"},
 ["D"],"medium",["acids-bases","amphoteric","complexes"],None),

(79,"CHEM","C07",1,20,
 "Thiosulphuric acid is:",
 {"A":"$\\text{H}_{2}\\text{S}_{2}\\text{O}_{3}$","B":"$\\text{H}_{2}\\text{SO}_{3}$","C":"$\\text{H}_{2}\\text{S}_{2}\\text{O}_{6}$","D":"$\\text{H}_{2}\\text{SO}_{4}$"},
 ["A"],"easy",["inorganic-chemistry","acids","sulphur"],None),

(80,"CHEM","C05",1,20,
 "The correct order of the acidity is:",
 {"A":"$\\text{HClO}_{4} > \\text{HClO}_{3} > \\text{HClO}_{2} > \\text{HClO}$","B":"$\\text{HClO} > \\text{HClO}_{2} > \\text{HClO}_{3} > \\text{HClO}_{4}$","C":"$\\text{HClO}_{3} > \\text{HClO}_{4} > \\text{HClO}_{2} > \\text{HClO}$","D":"$\\text{HClO}_{2} > \\text{HClO} > \\text{HClO}_{3} > \\text{HClO}_{4}$"},
 ["A"],"medium",["acids-bases","acidity","oxoacids"],None),

(81,"CHEM","C02",1,20,
 "The shape of the $\\text{NH}_{3}$ molecules is:",
 {"A":"pyramidal","B":"tetrahedral","C":"see-saw","D":"triangular planar"},
 ["A"],"easy",["chemical-bonding","vsepr","molecular-shape"],None),

(82,"CHEM","C08",1,20,
 "How many isomers are possible with molecular formula $\\text{C}_{4}\\text{H}_{9}\\text{Cl}$?",
 {"A":"$3$","B":"$4$","C":"$2$","D":"$5$"},
 ["B"],"medium",["organic","isomers","structural"],None),

(83,"CHEM","C07",1,20,
 "Which of the following oxides is used as a white pigment?",
 {"A":"$\\text{ZnO}$","B":"$\\text{HgO}$","C":"$\\text{CuO}$","D":"$\\text{NiO}$"},
 ["A"],"easy",["inorganic-chemistry","oxides","pigments"],None),

(84,"CHEM","C05",1,20,
 "If heat absorbed by a system and work done by the system are $120\\,\\text{J}$ and $30\\,\\text{J}$ respectively by a process, then change of internal energy of the system is",
 {"A":"$150\\,\\text{J}$","B":"$90\\,\\text{J}$","C":"$-150\\,\\text{J}$","D":"$-90\\,\\text{J}$"},
 ["B"],"easy",["thermodynamics","first-law","internal-energy"],None),

(85,"CHEM","C06",1,20,
 "The element of the following that reacts with $\\text{N}_{2}$ to form a nitride is:",
 {"A":"$\\text{Na}$","B":"$\\text{K}$","C":"$\\text{Cs}$","D":"$\\text{Li}$"},
 ["D"],"medium",["inorganic-chemistry","nitrides","alkali-metals"],None),

# ---------------- CHEMISTRY Cat-II (Q86-90) ----------------
(86,"CHEM","C05",2,21,
 "Which of the following aqueous solutions of metal chlorides is neutral?",
 {"A":"$\\text{AlCl}_{3}$","B":"$\\text{BeCl}_{2}$","C":"$\\text{BaCl}_{2}$","D":"$\\text{RbCl}$"},
 ["C","D"],"medium",["solutions","hydrolysis","neutral"],None),

(87,"CHEM","C03",2,21,
 "Which of the chemical conversion(s) as given below show(s) the highest degree of redox change?",
 {"A":"Phosphoric acid to phosphine.","B":"Nitric acid to molecular nitrogen.","C":"Sulphuric acid to elemental sulphur.","D":"Borax to diborane"},
 ["A"],"hard",["redox","oxidation-state","conversions"],None),

(88,"CHEM","C05",2,21,
 "A chemical change will be spontaneous at constant pressure and temperature under the set(s) of conditions",
 {"A":"$\\Delta H = -ve$, $\\Delta S = -ve$, $|\\Delta H| > |T\\Delta S|$","B":"$\\Delta H = +ve$, $\\Delta S = +ve$, $|\\Delta H| < |T\\Delta S|$","C":"$\\Delta H = -ve$, $\\Delta S = -ve$, $|\\Delta H| = |T\\Delta S|$","D":"$\\Delta H = +ve$, $\\Delta S = +ve$, $|\\Delta H| > |T\\Delta S|$"},
 ["A","B"],"hard",["thermodynamics","spontaneity","gibbs-free-energy"],None),

(89,"CHEM","C05",2,21,
 "Which of the following statement(s) is / are true?",
 {"A":"$K_{c}$ of a chemical reaction increases with increase in temperature for an exothermic reaction.","B":"$K_{p}$ of a chemical reaction increases with decrease in temperature for an endothermic reaction.","C":"$K_{c}$ of a chemical reaction increases with decrease in temperature for an exothermic reaction.","D":"$K_{c}$ of a chemical reaction decreases with decrease in temperature for an endothermic reaction."},
 ["C","D"],"medium",["equilibrium","temperature-dependence","van't-hoff"],None),

(90,"CHEM","C02",2,21,
 "Which of the following compounds have covalent bonds?",
 {"A":"$\\text{NaCl}$","B":"$\\text{H}_{2}\\text{O}$","C":"$\\text{CH}_{4}$","D":"$\\text{CaCO}_{3}$"},
 ["B","C"],"medium",["chemical-bonding","covalent","ionic"],None),

# ---------------- FEEE Cat-I (Q91-100) ----------------
(91,"FEEE","E04",1,22,
 "A voltage $v(t) = V_{m}\\sin\\omega t$ is connected to a moving Iron instrument. The reading of the instrument will be",
 {"A":"$V_{m}$","B":"$\\dfrac{2V_{m}}{\\pi}$","C":"$\\dfrac{V_{m}}{\\pi}$","D":"$\\dfrac{V_{m}}{\\sqrt{2}}$"},
 ["D"],"medium",["ac-circuits","rms-value","instruments"],None),

(92,"FEEE","E02",1,22,
 "A $25\\,\\text{KVA}$ transformer is constructed to a turn ratio of $N_{1}/N_{2} = 10$. The impedance of the primary winding is $2 + j5\\,\\Omega$ and of the secondary windings is $0.5 + j0.8\\,\\Omega$. What will be the impedance when referred to primary?",
 {"A":"$52 + j85\\,\\Omega$","B":"$2.5 + j5.8\\,\\Omega$","C":"$50 + j80\\,\\Omega$","D":"$0.025 + j0.508\\,\\Omega$"},
 ["A"],"medium",["transformers","impedance","referred-to-primary"],None),

(93,"FEEE","E03",1,22,
 "On the Torque - Speed curve of the Induction motor shown in the figure, four points of operation are marked, as $W$, $X$, $Y$ and $Z$. Which one represents the operation at a slip greater than $1$?",
 {"A":"$W$","B":"$X$","C":"$Y$","D":"$Z$"},
 ["D"],"medium",["electrical-machines","induction-motor","slip"],"fig-2022-q93"),

(94,"FEEE","E04",1,22,
 "A series circuit consists of two elements has the following current and applied voltage $i = 4\\cos(2000t + 11.32^{\\circ})\\,\\text{A}$ and $v = 200\\sin(2000t + 50^{\\circ})\\,\\text{V}$. The circuit elements are",
 {"A":"Resistance and Capacitance","B":"Capacitance and Inductance","C":"Inductance and Resistance","D":"Both resistances"},
 ["A"],"hard",["ac-circuits","phase","impedance"],None),

(95,"FEEE","E03",1,22,
 "Two incandescent light bulbs of $40\\,\\text{W}$ and $60\\,\\text{W}$ rating are connected in series across the mains. Then",
 {"A":"the bulbs together consume $100\\,\\text{W}$","B":"the bulbs together consume $50\\,\\text{W}$","C":"the $60\\,\\text{W}$ bulb glows brighter","D":"the $40\\,\\text{W}$ bulb glows brighter"},
 ["D"],"medium",["circuits","power","series-connection"],None),

(96,"FEEE","E04",1,23,
 "The average value of $v_{0}(t)$ in the given circuit will be",
 {"A":"$0$","B":"$\\dfrac{V_{m}}{\\pi}$","C":"$\\dfrac{2V_{m}}{\\pi}$","D":"$-V_{m}$"},
 ["B"],"hard",["ac-circuits","average-value","rectifier"],"fig-2022-q96"),

(97,"FEEE","E05",1,23,
 "In the comparator shown, $v_{i}$ is a sinusoidal input of peak value $6\\,\\text{V}$. The period (in degrees) for which the output will be high is",
 {"A":"$180^{\\circ}$","B":"$60^{\\circ}$","C":"$120^{\\circ}$","D":"$150^{\\circ}$"},
 ["C"],"medium",["digital-electronics","comparator","duty-cycle"],"fig-2022-q97"),

(98,"FEEE","E07",1,23,
 "What Boolean function does the following circuit represents?",
 {"A":"$A[F+(B+C).(D+E)]G$","B":"$A+BC+DEF+G$","C":"$A[(B+C)+F(D+E)]G$","D":"$ABG+ABC+F(D+E)$"},
 ["A"],"hard",["digital-electronics","boolean-algebra","circuits"],"fig-2022-q98"),

(99,"FEEE","E06",1,23,
 "If $I_{c} = 15\\,\\text{mA}$ and $V_{CB} = 3\\,\\text{V}$, then the value of $V_{CC}$ required is",
 {"A":"$4\\,\\text{V}$","B":"$4.5\\,\\text{V}$","C":"$3.15\\,\\text{V}$","D":"$18\\,\\text{V}$"},
 ["B"],"medium",["electronic-devices","transistor","biasing"],"fig-2022-q99"),

(100,"FEEE","E03",1,23,
 "A DC shunt motor is started with an open circuited field. Then",
 {"A":"The motor picks up fast and acquires full speed while drawing large current.","B":"Motor does not pick up speed but draws a large current.","C":"The motor does not pick up speed but draws only a small current.","D":"The motor picks up speed fast and acquires full speed while drawing only a small current."},
 ["A"],"medium",["electrical-machines","dc-shunt-motor","field-open"],None),
]
