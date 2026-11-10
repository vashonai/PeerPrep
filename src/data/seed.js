import { ROLES } from '../config/roles.js'
import { LOG_ACTIONS, VERIFICATION_STATUS as VS } from './models.js'

/**
 * Seed data for the local prototype. Timestamps are generated relative to the
 * moment the database is first created so the content always looks recent.
 */

export const DEMO_USER_IDS = {
  student: 'u-demo-student',
  lecturer: 'u-demo-lecturer',
  admin: 'u-demo-admin',
}

const USERS = [
  { id: DEMO_USER_IDS.student, firstName: 'Aaliyah', lastName: 'Campbell', email: 'student@peerprep.demo', role: ROLES.STUDENT, isDemo: true, joinedDaysAgo: 120 },
  { id: DEMO_USER_IDS.lecturer, firstName: 'Marcus', lastName: 'Reid', email: 'lecturer@peerprep.demo', role: ROLES.LECTURER, isDemo: true, joinedDaysAgo: 400 },
  { id: DEMO_USER_IDS.admin, firstName: 'Kemar', lastName: 'Thompson', email: 'admin@peerprep.demo', role: ROLES.STUDENT_ADMIN, isDemo: true, joinedDaysAgo: 300 },
  { id: 'u-priya', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@students.peerprep.edu', role: ROLES.STUDENT, joinedDaysAgo: 210 },
  { id: 'u-daniel', firstName: 'Daniel', lastName: 'Okafor', email: 'daniel.okafor@students.peerprep.edu', role: ROLES.STUDENT, joinedDaysAgo: 180 },
  { id: 'u-sofia', firstName: 'Sofia', lastName: 'Martinez', email: 'sofia.martinez@students.peerprep.edu', role: ROLES.STUDENT, joinedDaysAgo: 160 },
  { id: 'u-jordan', firstName: 'Jordan', lastName: 'Brown', email: 'jordan.brown@students.peerprep.edu', role: ROLES.STUDENT, joinedDaysAgo: 95 },
  { id: 'u-wei', firstName: 'Wei', lastName: 'Chen', email: 'wei.chen@students.peerprep.edu', role: ROLES.STUDENT, joinedDaysAgo: 70 },
  { id: 'u-helen', firstName: 'Helen', lastName: 'Morgan', email: 'h.morgan@peerprep.edu', role: ROLES.LECTURER, joinedDaysAgo: 500 },
]

const COURSES = [
  {
    id: 'c-dsa', code: 'COMP 2201', title: 'Data Structures & Algorithms', department: 'Computing',
    topics: [['t-dsa-lists', 'Linked Lists'], ['t-dsa-trees', 'Trees'], ['t-dsa-sorting', 'Sorting'], ['t-dsa-graphs', 'Graphs'], ['t-dsa-complexity', 'Complexity Analysis']],
  },
  {
    id: 'c-db', code: 'COMP 2310', title: 'Database Systems', department: 'Computing',
    topics: [['t-db-er', 'ER Modelling'], ['t-db-sql', 'SQL'], ['t-db-norm', 'Normalization'], ['t-db-tx', 'Transactions']],
  },
  {
    id: 'c-calc', code: 'MATH 1141', title: 'Calculus I', department: 'Mathematics',
    topics: [['t-calc-limits', 'Limits'], ['t-calc-diff', 'Differentiation'], ['t-calc-int', 'Integration'], ['t-calc-apps', 'Applications of Derivatives']],
  },
  {
    id: 'c-swen', code: 'SWEN 3101', title: 'Software Engineering', department: 'Computing',
    topics: [['t-swen-req', 'Requirements Engineering'], ['t-swen-uml', 'UML Modelling'], ['t-swen-test', 'Software Testing'], ['t-swen-agile', 'Agile Methods']],
  },
  {
    id: 'c-stat', code: 'STAT 2001', title: 'Probability & Statistics', department: 'Mathematics',
    topics: [['t-stat-prob', 'Probability'], ['t-stat-dist', 'Distributions'], ['t-stat-hyp', 'Hypothesis Testing']],
  },
  {
    id: 'c-econ', code: 'ECON 1001', title: 'Principles of Microeconomics', department: 'Economics',
    topics: [['t-econ-sd', 'Supply & Demand'], ['t-econ-elastic', 'Elasticity'], ['t-econ-markets', 'Market Structures']],
  },
]

const BOX_DIAGRAM = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" font-family="Arial" font-size="13">
  <rect width="320" height="240" fill="#f8fafc"/>
  <rect x="60" y="30" width="200" height="180" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2"/>
  <g fill="#fff" stroke="#4f46e5" stroke-width="2" stroke-dasharray="5 4">
    <rect x="60" y="30" width="36" height="36"/><rect x="224" y="30" width="36" height="36"/>
    <rect x="60" y="174" width="36" height="36"/><rect x="224" y="174" width="36" height="36"/>
  </g>
  <g fill="#312e81"><text x="72" y="54">x</text><text x="236" y="54">x</text><text x="72" y="198">x</text><text x="236" y="198">x</text>
  <text x="140" y="24">30 cm</text><text x="268" y="124">24 cm</text></g>
</svg>`,
)}`

/**
 * Questions: [id, courseId, topicId, difficulty, authorId, daysAgo, title, content, attachments?]
 */
const QUESTIONS = [
  ['q-bst-delete', 'c-dsa', 't-dsa-trees', 'Medium', 'u-priya', 12,
    'Deleting a node with two children from a binary search tree',
    'From the 2024 final exam, Question 3(b):\n\nA BST is built by inserting the keys 50, 30, 70, 20, 40, 60, 80 in that order.\n\n(i) Draw the tree after deleting the root (50).\n(ii) Explain which node replaces it and why the BST property still holds.\n(iii) State the worst-case time complexity of deletion and the shape of tree that causes it.'],
  ['q-dijkstra', 'c-dsa', 't-dsa-graphs', 'Hard', DEMO_USER_IDS.student, 5,
    "Why does Dijkstra's algorithm fail with negative edge weights?",
    "2023 Paper, Question 5(a): Give a small directed graph with one negative edge where Dijkstra's algorithm returns an incorrect shortest-path distance. Explain which step of the algorithm makes the wrong assumption, and name an algorithm that handles negative weights correctly."],
  ['q-master', 'c-dsa', 't-dsa-complexity', 'Hard', 'u-sofia', 9,
    'Solve T(n) = 2T(n/2) + n log n using the Master Theorem',
    'Mid-semester test, Question 2: Determine a tight asymptotic bound for the recurrence T(n) = 2T(n/2) + n log n. State which case of the Master Theorem applies (or whether the basic theorem applies at all) and justify your answer.'],
  ['q-quicksort', 'c-dsa', 't-dsa-sorting', 'Easy', 'u-jordan', 20,
    'Worst-case input for quicksort with a first-element pivot',
    'Tutorial-style exam question (2022, Q1d): Quicksort always chooses the first element as the pivot. Describe an input of size n that causes worst-case behaviour, give the resulting running time, and suggest one pivot strategy that avoids it in practice.'],
  ['q-bcnf', 'c-db', 't-db-norm', 'Hard', 'u-daniel', 7,
    'Decompose R(A, B, C, D, E) into BCNF',
    'Final exam 2024, Question 4:\n\nRelation R(A, B, C, D, E) has the functional dependencies:\n  A → B\n  BC → D\n  D → E\n\n(a) Find all candidate keys of R.\n(b) Decompose R into BCNF, showing each step.\n(c) Is your decomposition dependency-preserving? Explain.'],
  ['q-division', 'c-db', 't-db-sql', 'Medium', DEMO_USER_IDS.student, 3,
    'SQL: students enrolled in every Computing course (relational division)',
    'Given Student(sid, name), Course(cid, title, dept) and Enrolled(sid, cid), write a SQL query that returns the names of students who are enrolled in every course offered by the "Computing" department. This came up in the 2023 paper and I am not sure how to express "every" in SQL.'],
  ['q-lost-update', 'c-db', 't-db-tx', 'Easy', 'u-wei', 2,
    'Explain isolation and give an example of a lost update',
    'Short-answer question from the 2022 paper: Define the "I" in ACID. Then describe, with a timeline of two concurrent transactions, how a lost update can occur when isolation is not enforced.'],
  ['q-er-mn', 'c-db', 't-db-er', 'Medium', 'u-priya', 16,
    'Mapping a many-to-many relationship with attributes to tables',
    'An ER diagram has entities Student and Club with a many-to-many relationship "MemberOf" that has the attributes joinDate and role. Show the relational schema produced by the standard mapping, including primary and foreign keys.'],
  ['q-limit-sin', 'c-calc', 't-calc-limits', 'Easy', 'u-sofia', 25,
    'Evaluate lim (x → 0) of sin(3x) / (5x)',
    'Calculus I final 2023, Question 1(c): Evaluate the limit of sin(3x)/(5x) as x approaches 0 without using L\'Hôpital\'s rule. Show your working.'],
  ['q-ibp', 'c-calc', 't-calc-int', 'Medium', 'u-jordan', 11,
    'Integrate x² eˣ using integration by parts',
    'Evaluate ∫ x² eˣ dx. The marking scheme expects integration by parts applied twice; please show the choice of u and dv at each step.'],
  ['q-open-box', 'c-calc', 't-calc-apps', 'Medium', 'u-daniel', 6,
    'Maximising the volume of an open box cut from a sheet',
    'A 30 cm × 24 cm sheet of cardboard has equal squares of side x cut from each corner, and the sides are folded up to form an open box (see the attached diagram).\n\n(a) Express the volume V in terms of x.\n(b) Find the value of x that maximises V and verify it is a maximum.',
    [{ id: 'att-box', fileName: 'box-diagram.svg', mimeType: 'image/svg+xml', size: 1840, url: BOX_DIAGRAM }]],
  ['q-include-extend', 'c-swen', 't-swen-uml', 'Easy', DEMO_USER_IDS.admin, 14,
    'Difference between «include» and «extend» in use case diagrams',
    'Explain the difference between the «include» and «extend» relationships in a UML use case diagram. Give one example of each from an online banking system.'],
  ['q-bva', 'c-swen', 't-swen-test', 'Medium', 'u-wei', 8,
    'Boundary value analysis for an age validation function',
    'A function accepts an applicant\'s age as an integer and is valid only for ages 18 to 65 inclusive. Using boundary value analysis, list the test inputs you would choose and the expected result for each.'],
  ['q-bayes', 'c-stat', 't-stat-prob', 'Medium', 'u-priya', 4,
    "Bayes' theorem: probability of disease given a positive test",
    'A disease affects 1% of a population. A test detects the disease 95% of the time when it is present, and gives a false positive 5% of the time when it is absent. If a randomly chosen person tests positive, what is the probability they actually have the disease?'],
  ['q-tails', 'c-stat', 't-stat-hyp', 'Medium', DEMO_USER_IDS.student, 1,
    'Choosing between a one-tailed and a two-tailed t-test',
    'Past paper 2024, Question 6: A researcher claims a new teaching method increases mean exam scores. Should the hypothesis test be one-tailed or two-tailed? State H₀ and H₁ and explain the effect of the choice on the critical value at α = 0.05.'],
  ['q-ped', 'c-econ', 't-econ-elastic', 'Easy', 'u-sofia', 18,
    'Price elasticity of demand from a price change',
    'When the price of a concert ticket rises from $40 to $50, quantity demanded falls from 1,000 to 800 tickets. Using the midpoint method, calculate the price elasticity of demand and state whether demand is elastic or inelastic in this range.'],
]

/**
 * Answers: [id, questionId, authorId, hoursAfterQuestion, content, verification?]
 * verification: [status, reviewerId, hoursAfterAnswer, note]
 */
const ANSWERS = [
  ['a-bst-1', 'q-bst-delete', 'u-daniel', 5,
    '(i) Replace 50 with its in-order successor, 60 (the smallest key in the right subtree). The tree becomes: root 60, left subtree 30 (20, 40), right subtree 70 with only the right child 80.\n\n(ii) 60 is larger than everything in the left subtree and smaller than everything remaining in the right subtree, so the BST property holds. Because the successor has no left child, removing it from its old position is a simple case.\n\n(iii) O(h). In the worst case the tree is degenerate (a linked-list shape, e.g. keys inserted in sorted order), so deletion is O(n).',
    [VS.CORRECT, DEMO_USER_IDS.lecturer, 20, 'Clear and complete. Mentioning that the in-order predecessor is equally valid would make this perfect.']],
  ['a-bst-2', 'q-bst-delete', DEMO_USER_IDS.student, 30,
    'You can also use the in-order predecessor: 40 (the largest key in the left subtree) replaces 50. The root becomes 40 with left child 30 (which keeps 20) and right child 70 (60, 80). Either choice is accepted as long as you are consistent. Worst case is O(n) for a skewed tree.',
    [VS.CORRECT, 'u-helen', 12, '']],
  ['a-dij-1', 'q-dijkstra', 'u-wei', 6,
    'Example: vertices S, A, B with edges S→A (2), S→B (5), B→A (−4). Dijkstra finalises A with distance 2 first, because it is the smallest tentative distance. Later it relaxes B→A giving 5 − 4 = 1, but A is already finalised, so the reported distance stays 2.\n\nThe wrong assumption is that once a vertex is removed from the priority queue its distance can never decrease, which only holds if all edges are non-negative. Bellman–Ford handles negative weights.'],
  ['a-dij-2', 'q-dijkstra', 'u-jordan', 20,
    "Dijkstra's greedy choice assumes extending a path can never make it shorter. With a negative edge, a path through a vertex that looked more expensive can end up cheaper after it is processed. Use Bellman–Ford (O(VE)), which relaxes every edge V−1 times and can also detect negative cycles.",
    [VS.CORRECT, 'u-helen', 30, 'Good explanation of the greedy assumption.']],
  ['a-master-1', 'q-master', DEMO_USER_IDS.student, 8,
    'Here a = 2, b = 2 so n^(log_b a) = n. f(n) = n log n is bigger than n, so this is case 3 and T(n) = Θ(n log n).',
    [VS.INCORRECT, DEMO_USER_IDS.lecturer, 18, 'n log n is not polynomially larger than n, so case 3 does not apply. Look at the extended case 2: the answer is Θ(n log² n).']],
  ['a-master-2', 'q-master', 'u-priya', 26,
    'a = 2, b = 2, so n^(log₂2) = n. f(n) = n log n = Θ(n · log¹ n), which is the extended case 2 with k = 1. Therefore T(n) = Θ(n log^(k+1) n) = Θ(n log² n).\n\nThe basic three-case theorem does not apply directly because n log n is larger than n, but not by a polynomial factor n^ε.',
    [VS.CORRECT, DEMO_USER_IDS.lecturer, 6, '']],
  ['a-qs-1', 'q-quicksort', 'u-sofia', 10,
    'An already sorted (or reverse-sorted) array is the worst case: every partition puts n − 1 elements on one side. The running time becomes Θ(n²). Choosing a random pivot or using median-of-three avoids this on typical inputs.'],
  ['a-bcnf-1', 'q-bcnf', DEMO_USER_IDS.student, 14,
    '(a) A and C never appear on the right-hand side, so they must be in every key. {A, C}+ = {A, C, B, D, E}, so AC is the only candidate key.\n\n(b) A → B violates BCNF (A is not a superkey). Split into R1(A, B) and R2(A, C, D, E). In R2, D → E violates BCNF, so split into R3(D, E) and R4(A, C, D). Final: R1(A, B), R3(D, E), R4(A, C, D).\n\n(c) No — BC → D is lost because B and C are no longer in the same relation as D.'],
  ['a-div-1', 'q-division', DEMO_USER_IDS.admin, 9,
    'Use a double NOT EXISTS ("there is no Computing course the student is not enrolled in"):\n\nSELECT s.name\nFROM Student s\nWHERE NOT EXISTS (\n  SELECT c.cid FROM Course c\n  WHERE c.dept = \'Computing\'\n    AND NOT EXISTS (\n      SELECT 1 FROM Enrolled e\n      WHERE e.sid = s.sid AND e.cid = c.cid\n    )\n);\n\nAn alternative is GROUP BY sid HAVING COUNT(DISTINCT cid) = (SELECT COUNT(*) FROM Course WHERE dept = \'Computing\'), joined only on Computing courses.',
    [VS.CORRECT, DEMO_USER_IDS.lecturer, 15, 'Both approaches are correct. The NOT EXISTS version is the one expected on the exam.']],
  ['a-er-1', 'q-er-mn', 'u-jordan', 22,
    'Student(studentId PK, ...)\nClub(clubId PK, ...)\nMemberOf(studentId FK → Student, clubId FK → Club, joinDate, role, PRIMARY KEY (studentId, clubId))\n\nThe relationship becomes its own table, and its attributes go in that table.'],
  ['a-lim-1', 'q-limit-sin', DEMO_USER_IDS.student, 4,
    'Rewrite as (3/5) · sin(3x)/(3x). As x → 0, 3x → 0 and sin(u)/u → 1, so the limit is 3/5.',
    [VS.CORRECT, 'u-helen', 10, '']],
  ['a-ibp-1', 'q-ibp', 'u-wei', 7,
    'First: u = x², dv = eˣ dx → du = 2x dx, v = eˣ.\n∫ x² eˣ dx = x² eˣ − ∫ 2x eˣ dx.\n\nSecond: u = 2x, dv = eˣ dx → du = 2 dx, v = eˣ.\n∫ 2x eˣ dx = 2x eˣ − 2eˣ.\n\nResult: x² eˣ − 2x eˣ + 2eˣ + C = eˣ(x² − 2x + 2) + C.',
    [VS.CORRECT, DEMO_USER_IDS.lecturer, 12, '']],
  ['a-ibp-2', 'q-ibp', 'u-daniel', 15,
    'Apply integration by parts twice to get eˣ(x² + 2x + 2) + C.',
    [VS.CORRECT, 'u-helen', 4, ''],
    [VS.INCORRECT, DEMO_USER_IDS.lecturer, 40, 'Overriding: the sign of the middle term is wrong. Differentiate eˣ(x² + 2x + 2) to check — you get eˣ(x² + 4x + 4).']],
  ['a-box-1', 'q-open-box', 'u-priya', 18,
    '(a) V(x) = x(30 − 2x)(24 − 2x) for 0 < x < 12.\n\n(b) V(x) = 4x³ − 108x² + 720x, so V\'(x) = 12x² − 216x + 720 = 12(x² − 18x + 60). x = 9 ± √21, and only x ≈ 4.42 cm lies in the domain. V\'\'(x) = 24x − 216 < 0 at x ≈ 4.42, so it is a maximum (V ≈ 1,315 cm³).'],
  ['a-ie-1', 'q-include-extend', 'u-sofia', 12,
    '«include»: the base use case always runs the included behaviour. Example: "Transfer Funds" always includes "Authenticate User".\n\n«extend»: optional behaviour that runs only under a condition, at an extension point. Example: "Overdraft Warning" extends "Withdraw Cash" when the balance would go negative. The arrow points from the extending use case to the base.'],
  ['a-bva-1', 'q-bva', 'u-priya', 9,
    'Boundaries are 18 and 65. Test 17 (invalid), 18 (valid), 19 (valid), 64 (valid), 65 (valid), 66 (invalid). A nominal value such as 40 is often added as well.',
    [VS.CORRECT, DEMO_USER_IDS.lecturer, 20, 'Correct. Mention robustness testing (e.g. negative or non-integer input) for full marks.']],
  ['a-bayes-1', 'q-bayes', 'u-jordan', 3,
    'P(D) = 0.01, P(+|D) = 0.95, P(+|¬D) = 0.05.\nP(+) = 0.95·0.01 + 0.05·0.99 = 0.0095 + 0.0495 = 0.059.\nP(D|+) = 0.0095 / 0.059 ≈ 0.161, so about 16%.',
    [VS.CORRECT, 'u-helen', 8, '']],
  ['a-bayes-2', 'q-bayes', 'u-wei', 15,
    'Intuitively: out of 10,000 people, 100 have the disease and 95 of them test positive. Of the 9,900 without it, 495 test positive. So 95 / (95 + 495) ≈ 16.1%.'],
  ['a-ped-1', 'q-ped', 'u-daniel', 30,
    'Midpoint method: %ΔQ = (800 − 1000) / 900 = −22.2%. %ΔP = (50 − 40) / 45 = 22.2%. PED = −22.2 / 22.2 = −1.0, so demand is unit elastic over this range (|PED| = 1).'],
]

const HOUR = 3_600_000
const DAY = 24 * HOUR

export function createSeedData(now = Date.now()) {
  const iso = (ms) => new Date(ms).toISOString()

  const users = USERS.map(({ joinedDaysAgo, ...u }) => ({
    isDemo: false,
    ...u,
    createdAt: iso(now - joinedDaysAgo * DAY),
  }))

  const courses = []
  const topics = []
  for (const { topics: courseTopics, ...course } of COURSES) {
    const createdAt = iso(now - 365 * DAY)
    courses.push({ ...course, createdAt })
    for (const [id, name] of courseTopics) topics.push({ id, courseId: course.id, name, createdAt })
  }

  const questionTimes = {}
  const questions = QUESTIONS.map(([id, courseId, topicId, difficulty, authorId, daysAgo, title, content, attachments = []]) => {
    const createdMs = now - daysAgo * DAY - 3 * HOUR
    questionTimes[id] = createdMs
    return {
      id, title, content, courseId, topicId, difficulty, authorId,
      attachments: attachments.map((a) => ({ ...a, uploadedBy: authorId, uploadedAt: iso(createdMs) })),
      createdAt: iso(createdMs),
      updatedAt: iso(createdMs),
    }
  })

  const answers = []
  const verifications = []
  for (const [id, questionId, authorId, hoursAfter, content, ...reviews] of ANSWERS) {
    const createdMs = Math.min(questionTimes[questionId] + hoursAfter * HOUR, now - HOUR)
    const answer = {
      id, questionId, authorId, content, attachments: [],
      verificationStatus: VS.UNVERIFIED, verifiedBy: null, verifiedAt: null,
      createdAt: iso(createdMs), updatedAt: iso(createdMs),
    }
    let reviewMs = createdMs
    for (const [status, reviewerId, hoursLater, note] of reviews) {
      reviewMs = Math.min(reviewMs + hoursLater * HOUR, now - HOUR / 2)
      verifications.push({
        id: `v-${id}-${verifications.length}`,
        kind: 'review', answerId: id, questionId, reviewerId, status,
        previousStatus: answer.verificationStatus,
        isOverride: answer.verificationStatus !== VS.UNVERIFIED,
        note, createdAt: iso(reviewMs),
      })
      Object.assign(answer, { verificationStatus: status, verifiedBy: reviewerId, verifiedAt: iso(reviewMs) })
    }
    answers.push(answer)
  }

  const moderationLogs = [
    { id: 'm-1', actorId: DEMO_USER_IDS.admin, action: LOG_ACTIONS.ROLE_CHANGED, targetType: 'user', targetId: 'u-helen', summary: 'Helen Morgan: Student → Lecturer', reason: 'Confirmed faculty member (Mathematics).', createdAt: iso(now - 40 * DAY) },
    { id: 'm-2', actorId: DEMO_USER_IDS.admin, action: LOG_ACTIONS.TOPIC_CREATED, targetType: 'topic', targetId: 't-dsa-complexity', summary: 'COMP 2201 › Complexity Analysis', reason: '', createdAt: iso(now - 30 * DAY) },
    { id: 'm-3', actorId: DEMO_USER_IDS.admin, action: LOG_ACTIONS.QUESTION_DELETED, targetType: 'question', targetId: 'q-removed-1', summary: '"Selling full exam answers — DM me" by Jordan Brown', reason: 'Spam / academic dishonesty.', createdAt: iso(now - 3 * DAY) },
  ]

  const accessLogs = [
    { id: 'x-1', userId: 'u-jordan', action: 'route:/admin', resource: 'Administration dashboard', createdAt: iso(now - 2 * DAY) },
  ]

  return { users, credentials: [], courses, topics, questions, answers, verifications, moderationLogs, accessLogs }
}
