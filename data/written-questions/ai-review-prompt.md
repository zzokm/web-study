# Written question — AI review prompt

This is the clipboard prompt copied when a student clicks **Review with AI** after checking a written practice answer. It is built at runtime by [`web/src/lib/written-ai-review-prompt.ts`](../../web/src/lib/written-ai-review-prompt.ts).

Paste the copied text into any AI assistant (ChatGPT, Claude, Gemini, etc.) for a second opinion on correctness, syntax, logic, and improvements.

---

## When it appears

- **Practice only** — after **Check answer** on a written question (`/practice/written/`)
- Requires a non-empty submitted answer
- Not shown on browse (`/written/`) or practice results

---

## Prompt template

Placeholders in angle brackets are filled from the question catalog and the student’s editor.

```markdown
You are reviewing a student's coding answer for a web technology exam practice question.

## Topic
<question.topic>

## Language
<Human-readable language, e.g. JavaScript, Python, HTML>

## Question
<question.questionText>

## Context

<Included only when question.context is set.>

<context.text if present>

```<context.codeLanguage or html>
<context.code>
```

## My answer

```<answer language>
<student submission>
```

## Model answer

```<answer language>
<question.expectedAnswer>
```

## Official explanation

<question.explanation — omitted if empty>

## Your task

Please review my answer against the question requirements, the model answer, and the official explanation. Provide:

1. Whether my solution is correct, and what is missing or incorrect if not
2. Syntax mistakes or typos
3. Logical or structural issues
4. Shorter or better alternative approaches where applicable
5. Concrete suggestions to improve the code

Be specific and reference line-level details where helpful.
```

---

## Field sources

| Section | Source |
| --- | --- |
| Topic | `question.topic` |
| Language | `inferWrittenEditorLanguage(question)` → label (`JavaScript`, `Python`, `HTML`, `CSS`, …) |
| Question | `question.questionText` |
| Context | `question.context.text` and/or `question.context.code` (optional) |
| My answer | Student’s code from the practice editor |
| Model answer | `question.expectedAnswer` |
| Official explanation | `question.explanation` |
| Your task | Fixed review instructions (see template above) |

---

## Example (abbreviated)

```markdown
You are reviewing a student's coding answer for a web technology exam practice question.

## Topic
Frontend — JS DOM

## Language
JavaScript

## Question
1. Write an HTML `<div>` with the id 'status' and the text 'Pending'.
2. Write a JavaScript function `completeTask()` that changes the text of this div to 'Completed'.
3. Add a button that calls this function when clicked.

## My answer

```javascript
<div id="status">Pending</div>
<button onclick="completeTask()">Go</button>
<script>
function completeTask() {
  document.getElementById("status").innerHTML = "Done";
}
</script>
```

## Model answer

```javascript
<div id="status">Pending</div>
<button onclick="completeTask()">Complete</button>
<script>
function completeTask() {
  document.getElementById("status").innerHTML = "Completed";
}
</script>
```

## Official explanation

This task tests basic DOM manipulation. You need an element to target by ID, a button with an `onclick` event listener, and a JavaScript function that uses `document.getElementById` and `.innerHTML` to update the text.

## Your task

Please review my answer against the question requirements, the model answer, and the official explanation. Provide:

1. Whether my solution is correct, and what is missing or incorrect if not
2. Syntax mistakes or typos
3. Logical or structural issues
4. Shorter or better alternative approaches where applicable
5. Concrete suggestions to improve the code

Be specific and reference line-level details where helpful.
```

---

## Analytics

Copying the prompt fires GA4 event `written_ai_review_copy` with `question_key` and `answer_language`.
