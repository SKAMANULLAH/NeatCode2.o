require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const userModel = require("./models/userModel");
const topicModel = require("./models/topicModel");
const problemModel = require("./models/problemModel");
const quizModel = require("./models/quizModel");
const main = require("./config/db");

const SEED_PASSWORD = "Admin@12345";
const USER_PASSWORD = "User@12345";

const OUTPUT_DELIMITER = "__JUDGE_TC_END__";

const arraySumStartCode = {
  nodejs: `function arraySum(nums) {
    
}`,
  java: `public static int arraySum(int[] nums) {
        
    }`,
  cpp17: `int arraySum(vector<int>& nums) {
    
}`,
};

const arraySumSolution = {
  nodejs: `function arraySum(nums) {
  return nums.reduce(function (sum, value) {
    return sum + value;
  }, 0);
}`,
  java: `public static int arraySum(int[] nums) {
        int sum = 0;
        for (int i = 0; i < nums.length; i++) {
            sum += nums[i];
        }
        return sum;
    }`,
  cpp17: `int arraySum(vector<int>& nums) {
    int sum = 0;
    for (int i = 0; i < (int)nums.size(); i++) {
        sum += nums[i];
    }
    return sum;
}`,
};

const parenthesesStartCode = {
  nodejs: `function isValid(s) {
    
}`,
  java: `public static boolean isValid(String s) {
        
    }`,
  cpp17: `bool isValid(string s) {
    
}`,
};

const parenthesesSolution = {
  nodejs: `function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else {
      if (!stack.length || stack.pop() !== pairs[ch]) {
        return false;
      }
    }
  }
  return stack.length === 0;
}`,
  java: `public static boolean isValid(String s) {
        java.util.ArrayDeque<Character> stack = new java.util.ArrayDeque<Character>();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(' || ch == '[' || ch == '{') {
                stack.push(ch);
            } else {
                if (stack.isEmpty()) {
                    return false;
                }
                char top = stack.pop();
                if ((ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')) {
                    return false;
                }
            }
        }
        return stack.isEmpty();
    }`,
  cpp17: `bool isValid(string s) {
    stack<char> st;
    for (int i = 0; i < (int)s.size(); i++) {
        char ch = s[i];
        if (ch == '(' || ch == '[' || ch == '{') {
            st.push(ch);
        } else {
            if (st.empty()) {
                return false;
            }
            char top = st.top();
            st.pop();
            if ((ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')) {
                return false;
            }
        }
    }
    return st.empty();
}`,
};

const wrapArraySum = {
  nodejs: `const fs = require("fs");
const OUTPUT_DELIMITER = "${OUTPUT_DELIMITER}";

// USER_SOLUTION_START
${arraySumSolution.nodejs}
// USER_SOLUTION_END

const tokens = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
let i = 0;
while (i < tokens.length) {
  const n = tokens[i++];
  const nums = tokens.slice(i, i + n);
  i += n;
  process.stdout.write(String(arraySum(nums)) + "\\n" + OUTPUT_DELIMITER + "\\n");
}
`,
  java: `import java.util.*;
public class Main {
    static final String OUTPUT_DELIMITER = "${OUTPUT_DELIMITER}";

    // USER_SOLUTION_START
    ${arraySumSolution.java}
    // USER_SOLUTION_END

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) {
                nums[i] = sc.nextInt();
            }
            System.out.println(arraySum(nums));
            System.out.println(OUTPUT_DELIMITER);
        }
        sc.close();
    }
}
`,
  cpp17: `#include <bits/stdc++.h>
using namespace std;
const string OUTPUT_DELIMITER = "${OUTPUT_DELIMITER}";

// USER_SOLUTION_START
${arraySumSolution.cpp17}
// USER_SOLUTION_END

int main() {
    int n;
    while (cin >> n) {
        vector<int> nums(n);
        for (int i = 0; i < n; i++) {
            cin >> nums[i];
        }
        cout << arraySum(nums) << "\\n" << OUTPUT_DELIMITER << "\\n";
    }
    return 0;
}
`,
};

const wrapParentheses = {
  nodejs: `const fs = require("fs");
const OUTPUT_DELIMITER = "${OUTPUT_DELIMITER}";

// USER_SOLUTION_START
${parenthesesSolution.nodejs}
// USER_SOLUTION_END

const lines = fs.readFileSync(0, "utf8").split(/\\r?\\n/).filter(Boolean);
for (const line of lines) {
  process.stdout.write(String(isValid(line)) + "\\n" + OUTPUT_DELIMITER + "\\n");
}
`,
  java: `import java.util.*;
public class Main {
    static final String OUTPUT_DELIMITER = "${OUTPUT_DELIMITER}";

    // USER_SOLUTION_START
    ${parenthesesSolution.java}
    // USER_SOLUTION_END

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim();
            if (line.length() == 0) {
                continue;
            }
            System.out.println(isValid(line));
            System.out.println(OUTPUT_DELIMITER);
        }
        sc.close();
    }
}
`,
  cpp17: `#include <bits/stdc++.h>
using namespace std;
const string OUTPUT_DELIMITER = "${OUTPUT_DELIMITER}";

// USER_SOLUTION_START
${parenthesesSolution.cpp17}
// USER_SOLUTION_END

int main() {
    string line;
    while (getline(cin, line)) {
        if (line.empty()) {
            continue;
        }
        cout << (isValid(line) ? "true" : "false") << "\\n" << OUTPUT_DELIMITER << "\\n";
    }
    return 0;
}
`,
};

const startCodeFor = (map) => [
  { language: "nodejs", initialCode: map.nodejs },
  { language: "java", initialCode: map.java },
  { language: "cpp17", initialCode: map.cpp17 },
];

const referenceFor = (map) => [
  { language: "nodejs", completeCode: map.nodejs },
  { language: "java", completeCode: map.java },
  { language: "cpp17", completeCode: map.cpp17 },
];

const makeArrayCases = (count, withExplanation) => {
  const cases = [];
  for (let i = 0; i < count; i += 1) {
    const n = (i % 5) + 1;
    const nums = Array.from({ length: n }, (_, j) => i + j + 1);
    const sum = nums.reduce((a, b) => a + b, 0);
    const item = {
      input: `${n}\n${nums.join(" ")}`,
      output: String(sum),
    };
    if (withExplanation) {
      item.explanation = `The sum of [${nums.join(", ")}] is ${sum}.`;
    }
    cases.push(item);
  }
  return cases;
};

const parenthesesVisible = [
  {
    input: "()",
    output: "true",
    explanation: "A matching pair of parentheses is valid.",
  },
  {
    input: "()[]{}",
    output: "true",
    explanation: "Each opening bracket is closed in the correct order.",
  },
  {
    input: "(]",
    output: "false",
    explanation: "The types of brackets do not match.",
  },
];

const parenthesesHidden = [
  { input: "([])", output: "true" },
  { input: "{[]}", output: "true" },
  { input: "((", output: "false" },
  { input: "))", output: "false" },
  { input: "({[]})", output: "true" },
  { input: "({[)]}", output: "false" },
  { input: "abc", output: "false" },
  { input: "[", output: "false" },
  { input: "]", output: "false" },
  { input: "(((())))", output: "true" },
  { input: "(((())", output: "false" },
  { input: "[({})]", output: "true" },
  { input: "()()", output: "true" },
  { input: "())(", output: "false" },
  { input: "{[()()]}", output: "true" },
  { input: "{[(])}", output: "false" },
  { input: "(){}", output: "true" },
  { input: "((()))[]", output: "true" },
  { input: "((())])", output: "false" },
  { input: "([)]", output: "false" },
];

const seed = async () => {
  await main();

  const adminPassword = await bcrypt.hash(SEED_PASSWORD, 10);
  const userPassword = await bcrypt.hash(USER_PASSWORD, 10);

  const admin = await userModel.findOneAndUpdate(
    { email: "admin@neatcode.dev" },
    {
      firstName: "Admin",
      lastName: "User",
      email: "admin@neatcode.dev",
      password: adminPassword,
      role: "admin",
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  const student = await userModel.findOneAndUpdate(
    { email: "user@neatcode.dev" },
    {
      firstName: "Neat",
      lastName: "Coder",
      email: "user@neatcode.dev",
      password: userPassword,
      role: "user",
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  const topicPayloads = [
    {
      title: "Arrays",
      subtopic: [
        {
          title: "Introduction to Arrays",
          content: `# Arrays

Arrays store elements in contiguous memory and support index-based access.

## Example

\`\`\`javascript
const arr = [1, 2, 3];
console.log(arr[0]);
\`\`\`

Use arrays when you need fast random access.
`,
        },
        {
          title: "Two Pointer Technique",
          content: `# Two Pointer Technique

Use two indices that move toward each other or in the same direction.

## Common uses

- Pair sum in a sorted array
- Removing duplicates
- Partitioning

\`\`\`javascript
function reverse(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left += 1;
    right -= 1;
  }
  return arr;
}
\`\`\`
`,
        },
      ],
    },
    {
      title: "Stacks",
      subtopic: [
        {
          title: "Stack Basics",
          content: `# Stacks

A stack is Last In, First Out (LIFO).

## Operations

- \`push\`
- \`pop\`
- \`peek\`

\`\`\`javascript
const stack = [];
stack.push("(");
stack.pop();
\`\`\`

Stacks are useful for matching brackets and undo features.
`,
        },
      ],
    },
  ];

  const savedTopics = {};
  for (const payload of topicPayloads) {
    const topic = await topicModel.findOneAndUpdate(
      { title: payload.title },
      payload,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    savedTopics[payload.title] = topic;
  }

  const arraysTopic = savedTopics.Arrays;
  const stacksTopic = savedTopics.Stacks;
  const arraysIntro = arraysTopic.subtopic.find(
    (item) => item.title === "Introduction to Arrays",
  );
  const arraysTwoPointer = arraysTopic.subtopic.find(
    (item) => item.title === "Two Pointer Technique",
  );
  const stacksBasics = stacksTopic.subtopic.find(
    (item) => item.title === "Stack Basics",
  );

  const makeQuestion = (statement, choices, correct, topicId, subtopicId) => ({
    statement,
    option: choices.map((choice) => ({ choice })),
    correct,
    topicId,
    subtopicId,
  });

  const padQuestions = (questions, topicId, subtopicId, label, target) => {
    const extra = [];
    for (let i = questions.length + 1; i <= target; i += 1) {
      extra.push(
        makeQuestion(
          `${label} review question ${i}`,
          [
            `Option A for ${label} ${i}`,
            `Option B for ${label} ${i}`,
            `Option C for ${label} ${i}`,
            `Option D for ${label} ${i}`,
          ],
          "a",
          topicId,
          subtopicId,
        ),
      );
    }
    return questions.concat(extra);
  };

  const quizPayloads = [
    {
      title: "Arrays",
      question: [
        ...padQuestions(
          [
            makeQuestion(
              "What is the time complexity of accessing an array element by index?",
              ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
              "a",
              arraysTopic._id,
              arraysIntro._id,
            ),
            makeQuestion(
              "Which statement about arrays is true?",
              [
                "Elements are stored in contiguous memory",
                "Insertion at the front is always O(1)",
                "They cannot store numbers",
                "They do not support indexing",
              ],
              "a",
              arraysTopic._id,
              arraysIntro._id,
            ),
            makeQuestion(
              "What does arr[arr.length - 1] return in JavaScript?",
              [
                "The first element",
                "The last element",
                "The array length",
                "undefined always",
              ],
              "b",
              arraysTopic._id,
              arraysIntro._id,
            ),
          ],
          arraysTopic._id,
          arraysIntro._id,
          "Arrays intro",
          15,
        ),
        ...padQuestions(
          [
            makeQuestion(
              "Two pointers are most useful when the array is:",
              [
                "Sorted or can be processed from both ends",
                "A linked list only",
                "Always empty",
                "Stored on disk only",
              ],
              "a",
              arraysTopic._id,
              arraysTwoPointer._id,
            ),
            makeQuestion(
              "Which problem is a common two-pointer use case?",
              [
                "Reversing an array in place",
                "Building a binary tree",
                "Dijkstra shortest path",
                "Hashing passwords",
              ],
              "a",
              arraysTopic._id,
              arraysTwoPointer._id,
            ),
            makeQuestion(
              "If left and right pointers move toward each other, the loop should stop when:",
              [
                "left >= right",
                "left is 0",
                "right is n",
                "the array is unsorted",
              ],
              "a",
              arraysTopic._id,
              arraysTwoPointer._id,
            ),
          ],
          arraysTopic._id,
          arraysTwoPointer._id,
          "Two pointers",
          15,
        ),
      ],
    },
    {
      title: "Stacks",
      question: padQuestions(
        [
          makeQuestion(
            "Which data structure is LIFO?",
            ["Queue", "Stack", "Heap", "Graph"],
            "b",
            stacksTopic._id,
            stacksBasics._id,
          ),
          makeQuestion(
            "Which problem is commonly solved with a stack?",
            [
              "Shortest path in an unweighted graph",
              "Matching parentheses",
              "Finding the median",
              "Binary search",
            ],
            "b",
            stacksTopic._id,
            stacksBasics._id,
          ),
          makeQuestion(
            "What does pop return on an empty stack if you check first?",
            [
              "You should not pop an empty stack without a check",
              "The first inserted value",
              "Infinity",
              "The stack length",
            ],
            "a",
            stacksTopic._id,
            stacksBasics._id,
          ),
          makeQuestion(
            "Which stack operation adds an item?",
            ["pop", "push", "peek", "dequeue"],
            "b",
            stacksTopic._id,
            stacksBasics._id,
          ),
        ],
        stacksTopic._id,
        stacksBasics._id,
        "Stacks",
        15,
      ),
    },
  ];

  await quizModel.deleteMany({ title: { $in: ["Arrays Basics", "Stacks Basics", "Arrays", "Stacks"] } });

  for (const payload of quizPayloads) {
    await quizModel.findOneAndUpdate(
      { title: payload.title },
      payload,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }

  const visibleArray = makeArrayCases(3, true);
  const hiddenArray = makeArrayCases(20, false);

  const problemDocs = [
    {
      title: "Sum of Array",
      description:
        "Given an integer n followed by n integers, return the sum of the array.",
      difficulty: "easy",
      tags: "array",
      videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
      visibleTestCases: visibleArray,
      invisibleTestCases: hiddenArray,
      startCode: startCodeFor(arraySumStartCode),
      referenceSolution: referenceFor(wrapArraySum),
      problemCreator: admin._id,
    },
    {
      title: "Valid Parentheses",
      description:
        "Given a string of brackets, return true if the brackets are valid and false otherwise. Valid brackets are (), [] and {}.",
      difficulty: "easy",
      tags: "stack",
      videoUrl: "https://youtu.be/WTzjTskDFMg",
      visibleTestCases: parenthesesVisible,
      invisibleTestCases: parenthesesHidden,
      startCode: startCodeFor(parenthesesStartCode),
      referenceSolution: referenceFor(wrapParentheses),
      problemCreator: admin._id,
    },
  ];

  for (let i = 1; i <= 10; i += 1) {
    problemDocs.push({
      title: `Array Sum Practice ${i}`,
      description:
        "Given an integer n followed by n integers, return the sum of the array. This is extra practice data for pagination.",
      difficulty: i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy",
      tags: i % 2 === 0 ? "array" : "dp",
      videoUrl: "",
      visibleTestCases: visibleArray,
      invisibleTestCases: hiddenArray,
      startCode: startCodeFor(arraySumStartCode),
      referenceSolution: referenceFor(wrapArraySum),
      problemCreator: admin._id,
    });
  }

  const seededTitles = problemDocs.map((problem) => problem.title);
  await problemModel.deleteMany({ title: { $in: seededTitles } });
  const createdProblems = await problemModel.insertMany(problemDocs);

  student.problemSolved = [createdProblems[0]._id];
  await student.save();

  console.log("Seed completed.");
  console.log("Admin login: admin@neatcode.dev / Admin@12345");
  console.log("User login:  user@neatcode.dev / User@12345");
  console.log(`Topics: ${topicPayloads.length}`);
  console.log(`Quizzes: ${quizPayloads.length}`);
  console.log(`Problems: ${createdProblems.length}`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
