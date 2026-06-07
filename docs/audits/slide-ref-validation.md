# Slide reference validation report

## Syntax

```
slideRef = {lectureId}:{slideSpec}
lectureId  = ch1 | ch2 | ch3 | ch7 | ch8 | ch11 | ch13 | ch15 | ch18 | ch21
slideSpec  = s9 | s18-19 | s7,8 | s36-39 | all | course
```

Slide numbers map 1:1 to PDF page index in `Lectures/` (1-based).

## Lecture manifest

| lectureId | Chapter | PDF | Pages |
|-----------|---------|-----|------:|
| `ch1` | Chapter 1: Introduction | `Chapter 1 - Introduction.pdf` | 30 |
| `ch2` | Chapter 2: History and Current Thinking | `Chapter 2  - History and Current Thinking.pdf` | 49 |
| `ch3` | Chapter 3: Business Ethics | `Chapter 3 - Busniess Ethics.pdf` | 19 |
| `ch7` | Chapter 7: Principles of Planning | `Chapter 7 - Principles of Planning.pdf` | 27 |
| `ch8` | Chapter 8: Making Decisions | `Chapter 8 - Making Decisions.pdf` | 33 |
| `ch11` | Chapter 11: Fundamentals of Organizing | `Chapter 11 - Fundamentals of Organizing.pdf` | 38 |
| `ch13` | Chapter 13: Human Resource Management | `Chapter 13 - Human Resource Management.pdf` | 46 |
| `ch15` | Chapter 15: Influencing and Communication | `Chapter 15 - Influencing and Communication.pdf` | 25 |
| `ch18` | Chapter 18: Groups and Teams | `Chapter 18 - Groups and Teams.pdf` | 24 |
| `ch21` | Chapter 21: Controlling Fundamentals | `Chapter 21  - Controlling Fundamentals.pdf` | 19 |

## Summary

- **192/192** questions parsed successfully
- **0** errors

## Full comparison table

| Exam | ID | Kind | Extracted | slideRef | Parsed pages | Match | Reference (truncated) |
|------|-----|------|-----------|----------|--------------|:-----:|------------------------|
| final19.json | Q1.a | slides | 5 | `ch7:s5` | 5 | ✓ | Chapter 7: Principles of Planning - Answer found directly on Slide 5 u |
| final19.json | Q1.b | slides | 6,7 | `ch7:s6-7` | 6,7 | ✓ | Chapter 7: Principles of Planning - Answer found on Slide 6 and the di |
| final19.json | Q1.c | slides | 9 | `ch8:s9` | 9 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 9. |
| final19.json | Q1.d | slides | 11 | `ch11:s11` | 11 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final19.json | Q1.e | slides | 10 | `ch15:s10` | 10 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 10. |
| final19.json | Q1.f | slides | 6 | `ch7:s6` | 6 | ✓ | Chapter 7: Principles of Planning - Answer found verbatim on Slide 6 u |
| final19.json | Q1.g | slides | 9 | `ch18:s9` | 9 | ✓ | Chapter 18: Groups and Teams - Found on Slide 9. |
| final19.json | Q1.h | slides | 4 | `ch18:s4` | 4 | ✓ | Chapter 18: Groups and Teams - Found on Slide 4. |
| final19.json | Q1.i | slides | 13 | `ch21:s13` | 13 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final19.json | Q1.j | slides | 6 | `ch21:s6` | 6 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final19.json | Q2.a | slides | 6,7 | `ch7:s6-7` | 6,7 | ✓ | Chapter 7: Principles of Planning - Answer found on Slide 6 ('Basis fo |
| final19.json | Q2.b | slides | 29,32 | `ch8:s29,32` | 29,32 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 29 (Nominal Group  |
| final19.json | Q2.c | slides | 11,18 | `ch8:s11,18` | 11,18 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 11 and Slide 18. |
| final19.json | Q2.d | slides | 9 | `ch11:s9` | 9 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final19.json | Q2.e | slides | 6 | `ch15:s6` | 6 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 6. |
| final19.json | Q2.f | slides | 9 | `ch18:s9` | 9 | ✓ | Chapter 18: Groups and Teams - Found on Slide 9. |
| final19.json | Q2.g | slides | 8,9 | `ch21:s8-9` | 8,9 | ✓ | Chapter 21: Controlling Fundamentals - Answer found directly on Slide  |
| final19.json | Q2.h | slides | 16 | `ch21:s16` | 16 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from Slide 16 re |
| final21.json | Q1 | slides | 4 | `ch7:s4` | 4 | ✓ | Chapter 7: Principles of Planning - Answer supported by the definition |
| final21.json | Q2 | slides | 16,25 | `ch7:s16,25` | 16,25 | ✓ | Chapter 7: Principles of Planning - Answer found on Slide 16 (Types of |
| final21.json | Q3 | slides | 9,10 | `ch1:s9-10` | 9,10 | ✓ | Chapter 1: Introduction - Answer found on Slide 9 (Organizing) and Sli |
| final21.json | Q4 | slides | 10 | `ch1:s10` | 10 | ✓ | Chapter 1: Introduction - Answer found directly on Slide 10. |
| final21.json | Q5 | slides | 22 | `ch1:s22` | 22 | ✓ | Chapter 1: Introduction - Answer found directly on Slide 22. |
| final21.json | Q6 | slides | 22 | `ch1:s22` | 22 | ✓ | Chapter 1: Introduction - Answer found on Slide 22. |
| final21.json | Q7 | slides | 5 | `ch7:s5` | 5 | ✓ | Chapter 7: Principles of Planning - Answer found directly on Slide 5. |
| final21.json | Q8 | slides | 11,12 | `ch7:s11-12` | 11,12 | ✓ | Chapter 7: Principles of Planning - Answer supported by the definition |
| final21.json | Q9 | slides | 17 | `ch7:s17` | 17 | ✓ | Chapter 7: Principles of Planning - Answer supported by the 'Developin |
| final21.json | Q10 | slides | 23 | `ch7:s23` | 23 | ✓ | Chapter 7: Principles of Planning - Answer based on the MBO Advantages |
| final21.json | Q11 | slides | 5,6 | `ch8:s5-6` | 5,6 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 5 and Slide 6. |
| final21.json | Q12 | slides | 9,26 | `ch8:s9,26` | 9,26 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 9 and Slide 26. |
| final21.json | Q13 | slides | 11 | `ch8:s11` | 11 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 11. |
| final21.json | Q14 | slides | 16 | `ch18:s16` | 16 | ✓ | Chapter 18: Groups and Teams - Found on Slide 16. |
| final21.json | Q15 | slides | 7 | `ch11:s7` | 7 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found on Slide 7 (Orga |
| final21.json | Q16 | slides | 20,23 | `ch11:s20,23` | 20,23 | ✓ | Chapter 11: Fundamentals of Organizing - Answer deduced from Slide 20  |
| final21.json | Q17 | slides | 5,31 | `ch13:s5,31` | 5,31 | ✓ | Chapter 13: Human Resource Management - Answer found on Slide 31 (Trai |
| final21.json | Q18 | slides | 13,18 | `ch13:s13,18` | 13,18 | ✓ | Chapter 13: Human Resource Management - Deduced from Slide 13 (Objecti |
| final21.json | Q19 | slides | 4 | `ch21:s4` | 4 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from Slide 4 def |
| final21.json | Q20 | slides | 12,13 | `ch15:s12-13` | 12,13 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 12 a |
| final21.json | Q21 | slides | 9 | `ch18:s9` | 9 | ✓ | Chapter 18: Groups and Teams - Found on Slide 9. |
| final21.json | Q22 | slides | 9 | `ch21:s9` | 9 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final21.json | Q23 | slides | 17 | `ch21:s17` | 17 | ✓ | Chapter 21: Controlling Fundamentals - Answer found on Slide 17 under  |
| final21.json | Q24 | slides | 15,16 | `ch21:s15-16` | 15,16 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from the definit |
| final21.json | Q25 | slides | 6 | `ch7:s6` | 6 | ✓ | Chapter 7: Principles of Planning - Answer found verbatim on Slide 6 u |
| final21.json | Q26 | slides | 4 | `ch21:s4` | 4 | ✓ | Chapter 21: Controlling Fundamentals - Deduced from the definition of  |
| final21.json | Q27 | slides | 16,17 | `ch1:s16-17` | 16,17 | ✓ | Chapter 1: Introduction - Answer found on Slide 16 and Slide 17. |
| final21.json | Q28 | slides | 17 | `ch1:s17` | 17 | ✓ | Chapter 1: Introduction - Answer found on the matrix on Slide 17. |
| final21.json | Q29 | slides | 26,28 | `ch1:s26,28` | 26,28 | ✓ | Chapter 1: Introduction - Answer deduced by elimination from the table |
| final21.json | Q30 | slides | 5,6 | `ch8:s5-6` | 5,6 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 5 and Slide 6. |
| final21.json | Q31 | slides | 6 | `ch8:s6` | 6 | ✓ | Chapter 8: Making Decisions - Answer found on the Decision-Making Tech |
| final21.json | Q32 | slides | 5 | `ch11:s5` | 5 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final21.json | Q33 | slides | 11 | `ch11:s11` | 11 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final21.json | Q34 | slides | 12 | `ch11:s12` | 12 | ✓ | Chapter 11: Fundamentals of Organizing - Answer deduced from the Advan |
| final21.json | Q35 | slides | 5 | `ch13:s5` | 5 | ✓ | Chapter 13: Human Resource Management - Answer found verbatim on Slide |
| final21.json | Q36 | slides | 8 | `ch13:s8` | 8 | ✓ | Chapter 13: Human Resource Management - Answer found on the Job Analys |
| final21.json | Q37 | slides | 10 | `ch15:s10` | 10 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 10. |
| final21.json | Q38 | slides | 12 | `ch15:s12` | 12 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 12. |
| final21.json | Q39 | slides | 15,16 | `ch15:s15-16` | 15,16 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 15 a |
| final21.json | Q40 | slides | 15,16 | `ch15:s15-16` | 15,16 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 15 a |
| final21.json | Q41 | slides | 6 | `ch18:s6` | 6 | ✓ | Chapter 18: Groups and Teams - Found on Slide 6. |
| final21.json | Q42 | slides | 9 | `ch18:s9` | 9 | ✓ | Chapter 18: Groups and Teams - Found on Slide 9. |
| final21.json | Q43 | slides | 10,18 | `ch18:s10,18` | 10,18 | ✓ | Chapter 18: Groups and Teams - Found on Slide 10 (Committees) and Slid |
| final21.json | Q44 | slides | 6 | `ch21:s6` | 6 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final21.json | Q45 | slides | 4 | `ch21:s4` | 4 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final21.json | Q46 | slides | 11 | `ch21:s11` | 11 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final21.json | Q47 | slides | 13 | `ch21:s13` | 13 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final21.json | Q48 | slides | 15 | `ch21:s15` | 15 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from the definit |
| final24.json | Q1 | slides | 11 | `ch8:s11` | 11 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 11. |
| final24.json | Q2 | slides | 15,16 | `ch21:s15-16` | 15,16 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from Slide 15 an |
| final24.json | Q3 | slides | 8,13 | `ch21:s8,13` | 8,13 | ✓ | Chapter 21: Controlling Fundamentals - Answer derived from the Control |
| final24.json | Q4 | slides | 20 | `ch8:s20` | 20 | ✓ | Chapter 8: Making Decisions - Answer derived from Slide 20 (Decision-M |
| final24.json | Q5 | slides | 9 | `ch18:s9` | 9 | ✓ | Chapter 18: Groups and Teams - Found on Slide 9. |
| final24.json | Q6 | slides | 16 | `ch18:s16` | 16 | ✓ | Chapter 18: Groups and Teams - Found on Slide 16. |
| final24.json | Q7 | slides | 19 | `ch11:s19` | 19 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found on Slide 19 unde |
| final24.json | Q8 | slides | 9 | `ch11:s9` | 9 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final24.json | Q9 | slides | 18,19 | `ch11:s18-19` | 18,19 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found directly on Slid |
| final24.json | Q10 | slides | 19,34 | `ch11:s19,34` | 19,34 | ✓ | Chapter 11: Fundamentals of Organizing - Answer deduced from Slide 19  |
| final24.json | Q11 | slides | 12,13 | `ch15:s12-13` | 12,13 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 12 a |
| final24.json | Q12 | slides | 14 | `ch18:s14` | 14 | ✓ | Chapter 18: Groups and Teams - Inferred from Slide 14 and general mana |
| final24.json | Q13 | slides | 21 | `ch18:s21` | 21 | ✓ | Chapter 18: Groups and Teams - Found on Slide 21. |
| final24.json | Q14 | slides | 6 | `ch15:s6` | 6 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 6. |
| final24.json | Q15 | slides | 17 | `ch15:s17` | 17 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 17. |
| final24.json | Q16 | slides | 7,9 | `ch3:s7,9` | 7,9 | ✓ | Chapter 3: Business Ethics - Reflected in the stakeholder relations an |
| final24.json | Q17 | slides | 7 | `ch7:s7` | 7 | ✓ | Chapter 7: Principles of Planning - Based on external management theor |
| final24.json | Q18 | slides | 4 | `ch8:s4` | 4 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 4. |
| final24.json | Q19 | slides | 11 | `ch21:s11` | 11 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final24.json | Q20 | slides | 5,6 | `ch8:s5-6` | 5,6 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 5 and Slide 6. |
| final24.json | Q21 | slides | 5,6 | `ch8:s5-6` | 5,6 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 5 and Slide 6. |
| final24.json | Q22 | slides | 5 | `ch18:s5` | 5 | ✓ | Chapter 18: Groups and Teams - Found on Slide 5. |
| final24.json | Q23 | slides | 6 | `ch21:s6` | 6 | ✓ | Chapter 21: Controlling Fundamentals - Answer found on Slide 6 under M |
| final24.json | Q24 | slides | 9 | `ch3:s9` | 9 | ✓ | Chapter 3: Business Ethics - Based on external management theory (Frie |
| final24.json | Q25 | slides | 24,35 | `ch11:s24,35` | 24,35 | ✓ | Chapter 11: Fundamentals of Organizing - Answer aligns with Department |
| final24.json | Q26 | slides | 9 | `ch3:s9` | 9 | ✓ | Chapter 3: Business Ethics - Answer found directly on Slide 9 (Johnson |
| final24.json | Q27 | slides | 9 | `ch21:s9` | 9 | ✓ | Chapter 21: Controlling Fundamentals - Answer found directly on the li |
| final24.json | Q28 | slides | 15,16 | `ch15:s15-16` | 15,16 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 15 a |
| final24.json | Q29 | slides | 5 | `ch1:s5` | 5 | ✓ | Chapter 1: Introduction - Answer found verbatim on Slide 5. |
| final24.json | Q30 | slides | 9 | `ch18:s9` | 9 | ✓ | Chapter 18: Groups and Teams - Found on Slide 9. |
| final24.json | Q31 | slides | 5 | `ch11:s5` | 5 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final24.json | Q32 | slides | 6 | `ch8:s6` | 6 | ✓ | Chapter 8: Making Decisions - Answer found on the table on Slide 6. |
| final24.json | Q33 | slides | 12 | `ch15:s12` | 12 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 12. |
| final24.json | Q34 | slides | 3,5 | `ch15:s3,5` | 3,5 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 3 an |
| final24.json | Q35 | slides | 5 | `ch3:s5` | 5 | ✓ | Chapter 3: Business Ethics - Answer found verbatim on Slide 5 under "D |
| final24.json | Q36 | slides | 11 | `ch3:s11` | 11 | ✓ | Chapter 3: Business Ethics - Answer found verbatim on Slide 11 under " |
| final24.json | Q37 | slides | 15 | `ch3:s15` | 15 | ✓ | Chapter 3: Business Ethics - Answer found verbatim on Slide 15 under " |
| final24.json | Q38 | slides | 4,5 | `ch1:s4-5` | 4,5 | ✓ | Chapter 1: Introduction - Answer supported by the core concepts on Sli |
| final24.json | Q39 | slides | 21 | `ch18:s21` | 21 | ✓ | Chapter 18: Groups and Teams - Found on Slide 21. |
| final24.json | Q40 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer supported by the Planning P |
| final24.json | Q41 | slides | 19 | `ch18:s19` | 19 | ✓ | Chapter 18: Groups and Teams - Standard management terminology (Inferr |
| final24.json | Q42 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer deduced from the logical pr |
| final24.json | Q43 | slides | 12 | `ch18:s12` | 12 | ✓ | Chapter 18: Groups and Teams - Found on Slide 12. |
| final24.json | Q44 | slides | 17 | `ch15:s17` | 17 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 17. |
| final24.json | Q45 | slides | 7 | `ch7:s7` | 7 | ✓ | Chapter 7: Principles of Planning - Answer supported by the Primacy of |
| final24.json | Q46 | slides | 14 | `ch18:s14` | 14 | ✓ | Chapter 18: Groups and Teams - Found on Slide 14. |
| final24.json | Q47 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer based on Step 3 of the Plan |
| final24.json | Q48 | slides | 14,18 | `ch15:s14,18` | 14,18 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 14 a |
| final24.json | Q49 | slides | 12 | `ch15:s12` | 12 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 12. |
| final24.json | Q50 | slides | 21 | `ch18:s21` | 21 | ✓ | Chapter 18: Groups and Teams - Based on the definition of Interest Gro |
| final24.json | Q51 | slides | 4,6 | `ch7:s4,6` | 4,6 | ✓ | Chapter 7: Principles of Planning - Answer supported by the definition |
| final24.json | Q52 | slides | 16 | `ch18:s16` | 16 | ✓ | Chapter 18: Groups and Teams - Inferred from the definition and sympto |
| final24.json | Q53 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer based on Step 4 of the Plan |
| final24.json | Q54 | slides | 10 | `ch15:s10` | 10 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 10. |
| final24.json | Q55 | slides | 7 | `ch7:s7` | 7 | ✓ | Chapter 7: Principles of Planning - Answer supported by the 'Primacy o |
| final24.json | Q56 | slides | 12 | `ch11:s12` | 12 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final24.json | Q57 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer based on Step 3 of the Plan |
| final24.json | Q58 | slides | 9 | `ch11:s9` | 9 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final24.json | Q59 | slides | 7 | `ch15:s7` | 7 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 7. |
| final24.json | Q60 | slides | 16 | `ch18:s16` | 16 | ✓ | Chapter 18: Groups and Teams - Found verbatim on Slide 16. |
| final24.json | Q61 | slides | 13,14 | `ch1:s13-14` | 13,14 | ✓ | Chapter 1: Introduction - Answer supported by Slide 13 and the diagram |
| final24.json | Q62 | slides | 3 | `ch15:s3` | 3 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 3. |
| final24.json | Q63 | slides | 22 | `ch15:s22` | 22 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 22. |
| final24.json | Q64 | slides | 23,24 | `ch1:s23-24` | 23,24 | ✓ | Chapter 1: Introduction - Answer found on the visual charts on Slide 2 |
| final24.json | Q65 | slides | 11 | `ch21:s11` | 11 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from Slide 11. |
| final24.json | Q66 | slides | 16,17 | `ch1:s16-17` | 16,17 | ✓ | Chapter 1: Introduction - Answer found on Slide 16 and Slide 17. |
| final25.json | Q1 | slides | 8 | `ch21:s8` | 8 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from the Control |
| final25.json | Q2 | slides | 5 | `ch11:s5` | 5 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found verbatim on Slid |
| final25.json | Q3 | slides | 18,19 | `ch11:s18-19` | 18,19 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found directly on Slid |
| final25.json | Q4 | slides | 8 | `ch21:s8` | 8 | ✓ | Chapter 21: Controlling Fundamentals - Answer found directly on the Co |
| final25.json | Q5 | slides | 22 | `ch1:s22` | 22 | ✓ | Chapter 1: Introduction - Answer found on Slide 22. |
| final25.json | Q6 | course | — | `ch13:course` | — | ✓ | Chapter 13: Human Resource Management - Standard HR Management princip |
| final25.json | Q7 | slides | 10 | `ch13:s10` | 10 | ✓ | Chapter 13: Human Resource Management - Answer found verbatim on Slide |
| final25.json | Q8 | slides | 13,18 | `ch13:s13,18` | 13,18 | ✓ | Chapter 13: Human Resource Management - Answer deduced from Slide 13 a |
| final25.json | Q9 | slides | 9 | `ch18:s9` | 9 | ✓ | Chapter 18: Groups and Teams - Found on Slide 9. |
| final25.json | Q10 | slides | 6 | `ch18:s6` | 6 | ✓ | Chapter 18: Groups and Teams - Inferred from the definition of informa |
| final25.json | Q11 | slides | 14,15 | `ch18:s14-15` | 14,15 | ✓ | Chapter 18: Groups and Teams - Found on Slide 14 (Procedural) vs Slide |
| final25.json | Q12 | slides | 13 | `ch2:s13` | 13 | ✓ | Chapter 2: History and Current Thinking - Answer found on Slide 13 und |
| final25.json | Q13 | slides | 20,23 | `ch11:s20,23` | 20,23 | ✓ | Chapter 11: Fundamentals of Organizing - Answer deduced from Slide 20  |
| final25.json | Q14 | slides | 9 | `ch3:s9` | 9 | ✓ | Chapter 3: Business Ethics - Answer deduced from the principles of sta |
| final25.json | Q15 | slides | 5 | `ch8:s5` | 5 | ✓ | Chapter 8: Making Decisions - Answer found on Slide 5. |
| final25.json | Q16 | slides | 8 | `ch21:s8` | 8 | ✓ | Chapter 21: Controlling Fundamentals - Deduced from the Controlling Pr |
| final25.json | Q17 | slides | 16 | `ch11:s16` | 16 | ✓ | Chapter 11: Fundamentals of Organizing - Answer derived from the defin |
| final25.json | Q18 | slides | 4,5 | `ch1:s4-5` | 4,5 | ✓ | Chapter 1: Introduction - Answer supported by the definitions on Slide |
| final25.json | Q19 | slides | 7,24 | `ch11:s7,24` | 7,24 | ✓ | Chapter 11: Fundamentals of Organizing - Answer deduced from the Organ |
| final25.json | Q20 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer based on Step 4 of the Plan |
| final25.json | Q21 | slides | 31,33 | `ch13:s31,33` | 31,33 | ✓ | Chapter 13: Human Resource Management - Answer based on the definition |
| final25.json | Q22 | slides | 4 | `ch21:s4` | 4 | ✓ | Chapter 21: Controlling Fundamentals - Answer found verbatim on Slide  |
| final25.json | Q23 | slides | 16 | `ch11:s16` | 16 | ✓ | Chapter 11: Fundamentals of Organizing - Answer derived from the defin |
| final25.json | Q24 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer logically deduced from the  |
| final25.json | Q25 | slides | 7 | `ch7:s7` | 7 | ✓ | Chapter 7: Principles of Planning - Answer found on Slide 7 (Primacy o |
| final25.json | Q26 | all | — | `ch21:all` | 1..19 | ✓ | Chapter 21: Controlling Fundamentals - Inferred from the general use o |
| final25.json | Q27 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer based on Step 3 of the Plan |
| final25.json | Q28 | slides | 16 | `ch11:s16` | 16 | ✓ | Chapter 11: Fundamentals of Organizing - Answer deduced from the defin |
| final25.json | Q29 | slides | 6 | `ch21:s6` | 6 | ✓ | Chapter 21: Controlling Fundamentals - Answer found on Slide 6 under M |
| final25.json | Q30 | slides | 7,8 | `ch13:s7-8` | 7,8 | ✓ | Chapter 13: Human Resource Management - Answer found on Slide 7 and Sl |
| final25.json | Q31 | slides | 4,8 | `ch21:s4,8` | 4,8 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from Slide 4 and |
| final25.json | Q32 | slides | 5 | `ch7:s5` | 5 | ✓ | Chapter 7: Principles of Planning - Answer found directly on Slide 5 u |
| final25.json | Q33 | slides | 4 | `ch13:s4` | 4 | ✓ | Chapter 13: Human Resource Management - Answer supported by the 'Provi |
| final25.json | Q34 | slides | 25 | `ch11:s25` | 25 | ✓ | Chapter 11: Fundamentals of Organizing - Answer found on Slide 25 (Dep |
| final25.json | Q35 | slides | 4 | `ch21:s4` | 4 | ✓ | Chapter 21: Controlling Fundamentals - Answer found directly on Slide  |
| final25.json | Q36 | slides | 7 | `ch11:s7` | 7 | ✓ | Chapter 11: Fundamentals of Organizing - Answer logically follows the  |
| final25.json | Q37 | slides | 9 | `ch18:s9` | 9 | ✓ | Chapter 18: Groups and Teams - Based on the definition of Task Group o |
| final25.json | Q38 | slides | 3 | `ch15:s3` | 3 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 3. |
| final25.json | Q39 | slides | 12,14 | `ch15:s12,14` | 12,14 | ✓ | Chapter 15: Influencing and Communication - Answer found on Slide 12 a |
| final25.json | Q40 | slides | 4 | `ch21:s4` | 4 | ✓ | Chapter 21: Controlling Fundamentals - Deduced from the definition of  |
| final25.json | Q41 | slides | 9,11 | `ch21:s9,11` | 9,11 | ✓ | Chapter 21: Controlling Fundamentals - Answer deduced from the list of |
| final25.json | Q42 | slides | 24,35 | `ch11:s24,35` | 24,35 | ✓ | Chapter 11: Fundamentals of Organizing - Answer aligns with Department |
| final25.json | Q43 | slides | 10 | `ch7:s10` | 10 | ✓ | Chapter 7: Principles of Planning - Answer based on Step 4 of the Plan |
| final25.json | Q44 | slides | 11 | `ch21:s11` | 11 | ✓ | Chapter 21: Controlling Fundamentals - Deduced from the definition of  |
| final25.json | Q45 | slides | 33 | `ch13:s33` | 33 | ✓ | Chapter 13: Human Resource Management - Answer aligns with 'Looking in |
| final25.json | Q46 | slides | 6 | `ch18:s6` | 6 | ✓ | Chapter 18: Groups and Teams - Found verbatim on Slide 6. |
| final25.json | Q47 | slides | 7 | `ch7:s7` | 7 | ✓ | Chapter 7: Principles of Planning - Answer based on the Primacy of Pla |
| final25.json | Q48 | slides | 6 | `ch18:s6` | 6 | ✓ | Chapter 18: Groups and Teams - Found on Slide 6. |
| final25.json | Q49 | slides | 41 | `ch13:s41` | 41 | ✓ | Chapter 13: Human Resource Management - Answer found verbatim on Slide |
| final25.json | Q50 | slides | 7,19 | `ch11:s7,19` | 7,19 | ✓ | Chapter 11: Fundamentals of Organizing - Answer derived from Step 4 of |
| final25.json | Q51 | slides | 7 | `ch7:s7` | 7 | ✓ | Chapter 7: Principles of Planning - Answer supported by the connection |
| final25.json | Q52 | slides | 4 | `ch7:s4` | 4 | ✓ | Chapter 7: Principles of Planning - Answer supported by the definition |
| final25.json | Q53 | slides | 26 | `ch11:s26` | 26 | ✓ | Chapter 11: Fundamentals of Organizing - Answer derived from the advan |
| final25.json | Q54 | slides | 10,27 | `ch1:s10,27` | 10,27 | ✓ | Chapter 1: Introduction - Answer supported by the concepts on Slide 10 |
| final25.json | Q55 | slides | 41 | `ch13:s41` | 41 | ✓ | Chapter 13: Human Resource Management - Answer deduced from the defini |
| final25.json | Q56 | course | — | `ch13:course` | — | ✓ | Chapter 13: Human Resource Management - Standard HR Management princip |
| final25.json | Q57 | slides | 36,37,38,39 | `ch13:s36-39` | 36,37,38,39 | ✓ | Chapter 13: Human Resource Management - Answer supported by the 'Techn |
| final25.json | Q58 | slides | 16 | `ch18:s16` | 16 | ✓ | Chapter 18: Groups and Teams - Inferred from the definition and sympto |
| final25.json | Q59 | slides | 5 | `ch1:s5` | 5 | ✓ | Chapter 1: Introduction - Answer found verbatim on Slide 5. |
| final25.json | Q60 | slides | 8 | `ch1:s8` | 8 | ✓ | Chapter 1: Introduction - Slide 8 lists common managerial errors by management function. |
