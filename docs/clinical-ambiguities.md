# Clinical Ambiguities And Gaps

This file tracks places where the supplied PDFs do not fully specify machine-runnable rules.

## LFT pathway

Source:
`Adult Abnormal Liver Function Tests Primary Care Clinical Pathway`

### 1. "Significantly abnormal LFTs"

Source wording:
`Jaundice (Bil>40) and/or significantly abnormal LFTs ...`

Issue:
The PDF does not define what counts as `significantly abnormal`.

App rule:
Do not infer a numeric cut-off.
The clinician must answer this branch explicitly.

### 2. "Concerns re↓albumin or prolonged INR (if done)"

Source wording:
`Concerns re↓albumin or prolonged INR (if done)`

Issue:
The PDF does not define:

- an albumin threshold
- an INR threshold
- whether isolated low albumin alone is sufficient

App rule:
Do not infer a threshold or diagnosis.
The clinician must answer this concern branch explicitly.

### 3. Pattern entry for hepatitic and cholestatic LFTs

Source wording:

- `Normal Bilirubin with Hepatitic LFTs (ALT>ALP)`
- `Normal Bilirubin with Cholestatic LFTs (ALP>ALT)`

Issue:
The PDF does not provide lab-normal thresholds for ALT or ALP, only the relative comparison and branch label.

App rule:
The calculator should use the clinician-selected branch label, not invent local upper limits of normal from outside the PDF.

### 4. Raised GGT in the cholestatic branch

Source wording:
`Liver aetiology suggested by ↑GGT otherwise organise bone aetiology and check Vitamin D`

Issue:
No GGT threshold is defined.

App rule:
Treat `raised GGT` as a clinician-entered report fact, not a derived threshold.

### 5. "Appropriate specialty"

Source wording:
`Urgent Ultrasound and/or Urgent 2 week referral or admission to appropriate specialty`

Issue:
The pathway does not always specify the exact specialty destination.

App rule:
Keep this wording verbatim and avoid auto-assigning a specialty unless explicitly named downstream.

### 6. "Consider urgent referral pathway as clinically appropriate"

Source wording:
`Consider urgent referral pathway as clinically appropriate`

Issue:
The pathway gives no hard trigger for when referral should become urgent at this stage.

App rule:
Preserve as a verbatim note only.
Do not convert into an automatic urgency status.

### 7. Fatty liver page 2

Source wording:
`Fatty Liver Suggested by USS and Extended Liver Test Panel Negative for other Pathology Page 2 (Fatty Liver)`

Issue:
The provided PDF does not include that second fatty liver page content.

App rule:
The calculator can route to this destination, but cannot expand it into detailed downstream management from the supplied file alone.

## Anaemia pathway

Source:
`Abnormal Full Blood Count (FBC) in Adults Primary Care Clinical Pathway`

### 1. Pancytopenia branch representation

Source wording:
`Refer urgently if pancytopenia`

Issue:
The PDF uses the syndrome label `pancytopenia`.
If the app converts this into a single surrogate result such as low platelets alone, that is an inference.

App rule:
This should be clinician-confirmed explicitly unless all required cell-line criteria are defined in the source.

### 2. "Very symptomatic"

Source wording:
`If Hb <50g/l or very symptomatic - consider admission`

Issue:
The PDF does not define a symptom scoring rule.

App rule:
Treat `very symptomatic` as a clinician-entered judgement, not a derived score.

### 3. "Where clinically indicated"

Several anaemia branches end with wording such as:
`Refer to appropriate specialist in secondary care 2ww, Urgent, routine where clinically indicated or if remains unexplained`

Issue:
This does not define a single machine-selected specialty or urgency in all cases.

App rule:
Preserve the wording rather than over-assigning a deterministic destination.

### 4. Urgent GI/colorectal referral placement in the anaemia page

Source wording:
`Urgently/2ww refer to GI/Colorectal`

with:

- `Acute GI bleeding`
- `>60yrs with IDA`
- `<50yrs with IDA and rectal bleeding`

Issue:
The red urgent GI/colorectal wording is visually positioned near the early urgent branch on the PDF page, but the exact intended relationship to downstream IDA routing is not fully machine-explicit in the extracted text.

App rule:
The calculator preserves this wording and surfaces it as a note when IDA is identified with matching age / bleeding criteria, rather than silently rewriting the entire downstream route around an inferred placement.

### 5. Linked pathways outside the supplied PDF

Source wording:
- `See Iron deficiency pathway [1]`
- `Treatment for Vitamin B12, folate or Iron deficiency [2]`

Issue:
The anaemia page references linked material that may contain further downstream rules.
Those linked pathways are not automatically treated as part of this calculator unless their source content is explicitly supplied and audited.

App rule:
The calculator keeps the references verbatim but does not import extra referral logic from linked pathways unless that linked PDF has been separately reviewed and approved.

### 6. Ferritin 30-150 mcg/L with inflammatory states

Source wording:
`Indeterminate ferritin 30-150 mcg/L with no known inflammatory states`

Issue:
The PDF explicitly labels the ferritin 30-150 branch for patients with `no known inflammatory states`, but does not provide a separate machine-runnable destination for patients in the same ferritin range who do have inflammatory states.

App rule:
Require an explicit clinician answer on whether there are known inflammatory states.
If inflammation is present, stop and mark the branch as unresolved rather than inventing a downstream rule.

### 7. Symptomatic macrocytosis with B12 >170 ng/L and folate outside the explicit folate branch

Source wording:
- `B12 >170ng/l But strong index clinical suspicion check Intrinsic factor antibody If positive lifelong B12 replacement`
- `Serum folate <3ug/l or 3-4.5ug/l and symptomatic`
- `If clinical suspicion folate deficiency but normal serum levels, a red cell folate level below 340 nmol/L (150 micrograms/L) is consistent with clinical folate deficiency in the absence of vitamin B12 deficiency`

Issue:
The shared anaemia page does not provide a single final destination box for a symptomatic patient whose B12 is `>170ng/L`, whose clinician does not select the strong-suspicion B12 branch, and whose serum folate does not fall into the explicit folate branch.

App rule:
Surface this as an ambiguity and preserve the exact PDF statements about intrinsic factor antibodies and red cell folate, rather than forcing a synthetic final diagnosis.
