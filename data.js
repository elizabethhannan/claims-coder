/* Claims Coder data: coding vocabulary sample, insurer profiles, simulated owners, pets, policies and visits.
   Everything here is example data written for this prototype. */
(function () {
  "use strict";

  // Coding vocabulary sample. Term names follow common small animal diagnosis terms of the kind found in
  // the Small Animal Problem and Diagnosis Terms (SA-PDT). IDs are placeholders (SIM-) until the SA-PDT
  // release is downloaded with a VTS or UMLS account and its terms of use are confirmed.
  // needs: words that must appear in the note for the validator to call the code well supported.
  const V = (id, term, syn, system, def, needs, extra) => Object.assign({ id, term, syn, system, def, needs }, extra || {});
  const VOCAB = [
    V("SIM-1042", "Otitis externa", ["otitis ext", "external ear infection", "ear infection", "outer ear inflammation"], "Ear", "Inflammation of the external ear canal.", ["ear", "canal", "otic", "aural"], { curable: true }),
    V("SIM-1043", "Otitis media", ["middle ear infection"], "Ear", "Inflammation of the middle ear.", ["ear", "tympanic", "bulla"], { curable: true }),
    V("SIM-1050", "Ear mites", ["otodectes", "otodectic mange", "ear mite infestation"], "Ear", "Infestation of the ear canal with Otodectes cynotis.", ["mite", "otodectes"], { curable: true }),
    V("SIM-2310", "Malassezia infection", ["malassezia", "yeast infection", "malassezia dermatitis", "yeast otitis"], "Skin", "Overgrowth of Malassezia yeast on skin or in the ear canal.", ["yeast", "malassezia", "cytology"], { curable: true }),
    V("SIM-2301", "Atopic dermatitis", ["atopy", "environmental allergy", "allergic dermatitis"], "Skin", "Chronic itchy skin disease from environmental allergens.", ["pruritus", "itch", "scratch", "allerg"], { curable: false }),
    V("SIM-2302", "Flea allergy dermatitis", ["fad", "flea allergy"], "Skin", "Allergic skin reaction to flea saliva.", ["flea"], { curable: true }),
    V("SIM-2303", "Superficial pyoderma", ["pyoderma", "bacterial skin infection", "folliculitis"], "Skin", "Bacterial infection of the superficial skin layers.", ["pustule", "papule", "collarette", "cytology", "cocci", "lesion"], { curable: true }),
    V("SIM-2304", "Pyotraumatic dermatitis", ["hot spot", "acute moist dermatitis"], "Skin", "Acute, self-inflicted moist skin lesion.", ["moist", "lesion", "lick"], { curable: true }),
    V("SIM-2320", "Lipoma", ["fatty tumor", "fatty mass"], "Skin", "Benign tumor of fat cells.", ["mass", "aspirate", "fna", "subcutaneous"], { curable: true }),
    V("SIM-2330", "Mast cell tumor", ["mct", "mastocytoma"], "Skin", "Tumor of mast cells, usually in the skin.", ["mass", "aspirate", "mast"], { curable: false }),
    V("SIM-3101", "Acute gastroenteritis", ["gastroenteritis", "stomach upset", "age"], "Digestive", "Sudden inflammation of the stomach and intestines.", ["vomit", "diarrh", "stool", "abdom"], { curable: true }),
    V("SIM-3102", "Pancreatitis", ["acute pancreatitis", "inflamed pancreas"], "Digestive", "Inflammation of the pancreas.", ["cpli", "fpli", "pancrea", "abdom", "vomit"], { curable: false }),
    V("SIM-3103", "Gastrointestinal foreign body", ["foreign body", "gi foreign body", "intestinal obstruction"], "Digestive", "Swallowed object lodged in the stomach or intestine.", ["radiograph", "x-ray", "ultrasound", "obstruct", "object"], { curable: true }),
    V("SIM-3104", "Dietary indiscretion", ["garbage gut", "ate something"], "Digestive", "GI upset after eating something unusual.", ["ate", "trash", "garbage", "food"], { curable: true }),
    V("SIM-3105", "Giardiasis", ["giardia"], "Digestive", "Intestinal infection with Giardia.", ["giardia", "fecal", "stool"], { curable: true }),
    V("SIM-3106", "Hookworm infection", ["hookworms", "ancylostomiasis"], "Digestive", "Intestinal infection with hookworms.", ["fecal", "ova", "hookworm"], { curable: true }),
    V("SIM-3107", "Anal sac impaction", ["anal gland impaction", "impacted anal glands"], "Digestive", "Blocked anal sacs.", ["anal", "scoot", "express"], { curable: true }),
    V("SIM-3201", "Periodontal disease", ["periodontitis", "dental disease", "gum disease"], "Dental", "Infection and loss of the tissues that hold the teeth.", ["tooth", "teeth", "gingiv", "tartar", "calculus", "dental"], { curable: false }),
    V("SIM-3202", "Tooth fracture", ["fractured tooth", "broken tooth"], "Dental", "Break in a tooth crown or root.", ["tooth", "fracture", "pulp"], { curable: true }),
    V("SIM-3203", "Tooth resorption", ["resorptive lesion", "forl"], "Dental", "Breakdown of tooth structure, common in cats.", ["tooth", "resorpt", "radiograph"], { curable: true }),
    V("SIM-4101", "Cystitis", ["bladder infection", "bladder inflammation"], "Urinary", "Inflammation of the bladder.", ["urin", "bladder", "stranguria", "pollakiuria"], { curable: true }),
    V("SIM-4102", "Urinary tract infection", ["uti", "bacterial cystitis"], "Urinary", "Bacterial infection of the urinary tract.", ["urin", "culture", "bacteri"], { curable: true }),
    V("SIM-4103", "Feline idiopathic cystitis", ["fic", "flutd", "feline lower urinary tract disease"], "Urinary", "Bladder inflammation in cats with no other cause found.", ["urin", "bladder", "stranguria"], { curable: false, species: ["cat"] }),
    V("SIM-4104", "Urethral obstruction", ["blocked cat", "urinary blockage", "urethral plug"], "Urinary", "Blockage of the urethra so urine cannot pass.", ["urin", "bladder", "urethra", "catheter"], { curable: true }),
    V("SIM-4105", "Chronic kidney disease", ["ckd", "chronic renal failure", "kidney disease"], "Urinary", "Long-term loss of kidney function.", ["creatinine", "sdma", "bun", "kidney", "renal"], { curable: false }),
    V("SIM-4106", "Urolithiasis", ["bladder stones", "uroliths", "cystic calculi"], "Urinary", "Stones in the urinary tract.", ["stone", "radiograph", "ultrasound", "urolith"], { curable: true }),
    V("SIM-5101", "Diabetes mellitus", ["diabetes", "dm", "sugar diabetes"], "Endocrine", "Persistent high blood sugar from too little insulin or insulin resistance.", ["glucose", "glucosuria", "fructosamine", "insulin"], { curable: false }),
    V("SIM-5102", "Hyperthyroidism", ["overactive thyroid"], "Endocrine", "Overproduction of thyroid hormone, common in older cats.", ["t4", "thyroid"], { curable: false, species: ["cat"] }),
    V("SIM-5103", "Hypothyroidism", ["underactive thyroid"], "Endocrine", "Underproduction of thyroid hormone, common in dogs.", ["t4", "thyroid", "tsh"], { curable: false, species: ["dog"] }),
    V("SIM-6101", "Cranial cruciate ligament rupture", ["ccl rupture", "ccl tear", "torn acl", "cruciate tear", "cruciate rupture"], "Musculoskeletal", "Tear of the cranial cruciate ligament of the knee.", ["stifle", "drawer", "knee", "lame"], { curable: false, species: ["dog"] }),
    V("SIM-6102", "Osteoarthritis", ["arthritis", "degenerative joint disease", "djd"], "Musculoskeletal", "Degenerative joint disease.", ["joint", "stiff", "radiograph", "lame"], { curable: false }),
    V("SIM-6103", "Hip dysplasia", ["dysplastic hips"], "Musculoskeletal", "Abnormal development of the hip joint.", ["hip", "radiograph", "ortolani"], { curable: false }),
    V("SIM-6104", "Soft tissue injury", ["sprain", "strain", "muscle strain"], "Musculoskeletal", "Injury to muscle, tendon or ligament without fracture.", ["lame", "swelling", "pain", "limb"], { curable: true }),
    V("SIM-6105", "Fracture", ["broken bone", "bone fracture"], "Musculoskeletal", "Break in a bone.", ["radiograph", "x-ray", "bone"], { curable: true }),
    V("SIM-6106", "Patellar luxation", ["luxating patella", "kneecap dislocation"], "Musculoskeletal", "Kneecap slips out of place.", ["patella", "stifle", "knee"], { curable: false }),
    V("SIM-7101", "Laceration", ["cut", "wound", "skin laceration"], "Injury", "Cut through the skin.", ["wound", "suture", "skin", "bleed"], { curable: true }),
    V("SIM-7102", "Bite wound", ["dog bite", "cat bite", "bite injury"], "Injury", "Wound caused by an animal bite.", ["bite", "puncture", "wound"], { curable: true }),
    V("SIM-7103", "Abscess", ["cat bite abscess", "subcutaneous abscess"], "Injury", "Pocket of pus under the skin.", ["swelling", "pus", "lanced", "drain"], { curable: true }),
    V("SIM-7104", "Toxin ingestion", ["poisoning", "toxicity", "ate chocolate", "xylitol ingestion"], "Injury", "Swallowed a toxic substance.", ["ingest", "ate", "toxic", "emesis"], { curable: true }),
    V("SIM-8101", "Conjunctivitis", ["pink eye", "eye inflammation"], "Eye", "Inflammation of the conjunctiva.", ["eye", "conjunctiv", "discharge", "ocular"], { curable: true }),
    V("SIM-8102", "Corneal ulcer", ["ulcerative keratitis", "eye ulcer", "corneal abrasion"], "Eye", "Loss of the outer layer of the cornea.", ["fluorescein", "cornea", "eye", "stain"], { curable: true }),
    V("SIM-9101", "Upper respiratory infection", ["uri", "cat flu", "feline upper respiratory"], "Respiratory", "Infection of the nose and throat.", ["sneez", "nasal", "discharge"], { curable: true }),
    V("SIM-9102", "Canine infectious respiratory disease", ["kennel cough", "cirdc", "infectious tracheobronchitis"], "Respiratory", "Contagious cough in dogs.", ["cough", "trachea"], { curable: true, species: ["dog"] }),
    V("SIM-9103", "Pneumonia", ["lung infection"], "Respiratory", "Infection or inflammation of the lungs.", ["radiograph", "lung", "crackles", "fever"], { curable: true }),
    V("SIM-9104", "Feline asthma", ["asthma", "allergic bronchitis"], "Respiratory", "Narrowing of the airways in cats.", ["wheez", "cough", "bronch"], { curable: false, species: ["cat"] }),
    V("SIM-9201", "Heart murmur", ["murmur"], "Cardiovascular", "Abnormal heart sound.", ["auscult", "murmur", "heart"], { curable: false }),
    V("SIM-9202", "Congestive heart failure", ["chf", "heart failure"], "Cardiovascular", "Heart cannot pump enough blood, causing fluid buildup.", ["radiograph", "edema", "effusion", "heart"], { curable: false }),
    V("SIM-9203", "Hypertrophic cardiomyopathy", ["hcm"], "Cardiovascular", "Thickening of the heart muscle, common in cats.", ["echo", "heart", "murmur"], { curable: false, species: ["cat"] }),
    V("SIM-9301", "Idiopathic epilepsy", ["epilepsy", "seizure disorder"], "Neurologic", "Recurring seizures with no other cause found.", ["seizure"], { curable: false }),
    V("SIM-9302", "Seizure", ["seizures", "convulsion", "fit"], "Neurologic", "Episode of abnormal brain electrical activity.", ["seizure", "convuls", "tremor"], { curable: true }),
    V("SIM-9303", "Intervertebral disc disease", ["ivdd", "slipped disc", "disc herniation"], "Neurologic", "Spinal disc bulges or ruptures.", ["spine", "spinal", "back", "paresis"], { curable: false }),
    V("SIM-9401", "Hemangiosarcoma", ["hsa"], "Cancer", "Cancer of blood vessel cells.", ["ultrasound", "mass", "spleen", "effusion"], { curable: false }),
    V("SIM-9402", "Lymphoma", ["lymphosarcoma"], "Cancer", "Cancer of lymphocytes.", ["lymph", "node", "aspirate"], { curable: false }),
  ];

  // Insurer requirement profiles.
  const INSURERS = {
    northpaw: {
      id: "northpaw", name: "Northpaw Mutual (fictional)", fictional: true,
      required: [["claimForm", "Claim form: pet, visit date, clinic, reason"], ["soapNote", "Medical record (SOAP note) for the visit"], ["itemizedInvoice", "Itemized invoice or estimate"], ["codes", "A diagnosis code for every billed condition"]],
      recommended: [["history", "Prior medical records for new pets"]],
      waitingDays: 14, lookbackMonths: 12, curableFreeDays: 365, directPayNetwork: true, deductible: "yearly", planCap: "unlimited",
      preexistingRule: "Pre-existing if signs appear in the 12 months before coverage starts or during the 14-day illness wait. A curable condition free of signs and treatment for 365 days may be covered again.",
      source: null,
    },
    pumpkin: {
      id: "pumpkin", name: "Pumpkin (published requirements)", fictional: false,
      required: [["claimForm", "Claim form with visit details"], ["itemizedInvoice", "Itemized invoice (copy or photo)"]],
      recommended: [["soapNote", "Relevant medical records"]],
      fastTrack: { min: 500, label: "PumpkinNow: eligible vet care of $500 or more can be filed with a final invoice before you pay" },
      waitingDays: 14, lookbackMonths: null, curableFreeDays: 180, directPayNetwork: false,
      preexistingRule: "Not covered if a condition occurs or shows symptoms before coverage starts or during a waiting period. A curable condition may be covered if it recurs after the pet was free of symptoms and treatment for 180 days.",
      source: [["Pumpkin claims page", "https://www.pumpkin.care/claims"], ["Pumpkin FAQs", "https://www.pumpkin.care/faqs"]],
    },
  };

  const CLINICS = {
    kierland: { id: "kierland", name: "Kierland Animal Clinic", city: "Scottsdale, AZ", real: true, inNetwork: true },
    afterhours: { id: "afterhours", name: "After-hours emergency clinic (fictional)", city: "Phoenix, AZ", real: false, inNetwork: false },
  };

  const OWNERS = [
    { id: "o1", name: "K. Alvarez", city: "Scottsdale, AZ", policy: "NPM-20417" },
    { id: "o2", name: "D. Nakamura", city: "Phoenix, AZ", policy: "NPM-20533" },
    { id: "o3", name: "R. Okafor", city: "Tempe, AZ", policy: "NPM-20601" },
  ];

  const PETS = [
    { id: "p1", owner: "o1", name: "Juniper", species: "dog", breed: "Labrador mix", age: 6, coverageStart: "2026-03-23", deductible: 250, deductibleMet: 243.11,
      history: [{ date: "2025-12-18", clinic: "kierland", text: "Owner reports ear itching and head shaking, left ear. Mild erythema." }] },
    { id: "p2", owner: "o1", name: "Pepper", species: "cat", breed: "domestic shorthair", age: 9, coverageStart: "2026-03-23", deductible: 250, deductibleMet: 250, history: [] },
    { id: "p3", owner: "o2", name: "Miso", species: "cat", breed: "Siamese", age: 4, coverageStart: "2025-11-02", deductible: 100, deductibleMet: 100,
      history: [{ date: "2025-08-14", clinic: "kierland", text: "Straining to urinate, small frequent urinations. Urinalysis: hematuria." }] },
    { id: "p4", owner: "o3", name: "Bruno", species: "dog", breed: "Boxer", age: 8, coverageStart: "2024-06-10", deductible: 500, deductibleMet: 120, history: [] },
    { id: "p5", owner: "o3", name: "Lola", species: "dog", breed: "Dachshund", age: 5, coverageStart: "2026-07-01", deductible: 250, deductibleMet: 0, history: [] },
    { id: "p6", owner: "o3", name: "Tofu", species: "cat", breed: "Maine Coon", age: 2, coverageStart: "2026-01-15", deductible: 250, deductibleMet: 80, history: [] },
  ];

  // Seeded visits. Each becomes a claim the agents code when the page loads.
  const VISITS = [
    { claim: "4821", pet: "p1", clinic: "kierland", visit: "2026-10-20", filed: "2026-10-20T09:13:02", paid: false, docType: "invoice",
      note: "Patient: Juniper, canine, Labrador mix, 6 y\nClinic: Kierland Animal Clinic\nDate of visit: 10/20/2026\nS: Owner reports head shaking and scratching at the left ear for 4 days. Eating and drinking normally.\nO: T 101.8 F. Right ear normal. Left ear canal: erythema, brown discharge, odor. Cytology: yeast 3+, cocci 1+.\nA: 1. Otitis externa, left ear, Malassezia. 2. r/o atopic dermatitis.\nP: Ear cleaning in clinic. Otic ointment twice daily for 10 days. Recheck in 14 days.",
      invoice: "Exam, sick visit 1 68.00\nEar cytology 1 46.00\nEar cleaning 1 38.00\nOtic ointment, 10 days 1 62.00\nTotal 214.00" },
    { claim: "4630", pet: "p1", clinic: "kierland", visit: "2026-08-02", filed: "2026-08-02T16:05:40", paid: true, docType: "invoice", status: "Submitted Aug 3",
      note: "Patient: Juniper, canine, 6 y\nDate of visit: 08/02/2026\nS: Vomiting x3 and diarrhea since last night after getting into the trash.\nO: Mildly dehydrated, abdomen soft, nonpainful. No foreign material on palpation.\nA: 1. Acute gastroenteritis. 2. Dietary indiscretion.\nP: SQ fluids, maropitant injection, bland diet 3 days.",
      invoice: "Exam, sick visit 1 68.00\nSubcutaneous fluids 1 54.50\nMaropitant injection 1 41.00\nBland diet cans 6 30.00\nTotal 193.50" },
    { claim: "4512", pet: "p1", clinic: "afterhours", visit: "2026-06-11", filed: "2026-06-11T23:48:10", paid: true, docType: "invoice", status: "Submitted Jun 12",
      note: "Patient: Juniper, canine\nDate of visit: 06/11/2026\nS: Cut left front leg on a fence.\nO: 4 cm laceration, left forelimb, bleeding controlled. No bone involvement.\nA: Laceration, left forelimb.\nP: Sedation, wound flush, 6 sutures, antibiotics 7 days, recheck 10 days.",
      invoice: "Emergency exam 1 145.00\nSedation 1 120.00\nWound repair with sutures 1 260.00\nAmoxicillin-clavulanate tablets 14 47.00\nE-collar 1 40.00\nTotal 612.00" },
    { claim: "4777", pet: "p2", clinic: "kierland", visit: "2026-09-30", filed: "2026-09-30T14:20:05", paid: false, docType: "estimate", status: "Estimate",
      note: "Patient: Pepper, feline, DSH, 9 y\nDate of visit: 09/30/2026\nS: Dropping food, bad breath.\nO: Grade 3 dental calculus, gingivitis, left mandibular premolar with tooth resorption on dental radiographs.\nA: 1. Periodontal disease. 2. Tooth resorption.\nP: Dental cleaning under anesthesia with extraction of affected tooth.",
      invoice: "Anesthesia 1 185.00\nDental radiographs 1 120.00\nDental cleaning and polishing 1 110.00\nSurgical extraction 1 95.00\nPain medication 1 30.00\nTotal 540.00" },
    { claim: "4844", pet: "p3", clinic: "kierland", visit: "2026-10-21", filed: "2026-10-21T08:02:51", paid: true, docType: "invoice",
      note: "Patient: Miso, feline, Siamese, 4 y\nDate of visit: 10/21/2026\nS: Straining in the litter box, crying.\nO: Bladder small, painful. Urinalysis: hematuria, no crystals. Culture pending.\nA: 1. Feline idiopathic cystitis. 2. Suspect urinary tract infection, culture pending.\nP: Buprenorphine, wet food, stress reduction. Call with culture.",
      invoice: "Exam, sick visit 1 68.00\nUrinalysis 1 72.00\nUrine culture 1 95.00\nBuprenorphine 1 28.00\nTotal 263.00" },
    { claim: "4851", pet: "p4", clinic: "kierland", visit: "2026-10-22", filed: "2026-10-22T10:44:19", paid: false, docType: "estimate",
      note: "Patient: Bruno, canine, Boxer, 8 y\nDate of visit: 10/22/2026\nS: Non-weight-bearing right hind after running in the yard.\nO: Positive cranial drawer, right stifle effusion. Radiographs: joint effusion, early osteoarthritis.\nA: 1. Cranial cruciate ligament rupture, right. 2. Osteoarthritis, right stifle.\nP: Surgical consult for TPLO. Carprofen 14 days.",
      invoice: "Exam, sick visit 1 68.00\nRadiographs, stifle 2 310.00\nTPLO surgery estimate 1 4200.00\nCarprofen tablets 28 52.00\nTotal 4630.00" },
    { claim: "4862", pet: "p5", clinic: "afterhours", visit: "2026-10-22", filed: "2026-10-22T22:41:07", paid: true, docType: "invoice",
      note: "Patient: Lola, canine, Dachshund, 5 y\nClinic: After-hours emergency clinic\nDate of visit: 10/22/2026\nS: Emergency visit. Ate most of a bar of dark chocolate about 1 hour ago. Restless, panting.\nO: Heart rate 180, mild tremors, abdomen nonpainful.\nA: Toxin ingestion (chocolate, theobromine).\nP: Induced vomiting, activated charcoal, IV fluids, hospitalized overnight with ECG monitoring.",
      invoice: "Emergency exam 1 145.00\nInduce vomiting, apomorphine 1 85.00\nActivated charcoal 1 65.00\nIV fluids 1 210.00\nHospitalization, overnight 1 380.00\nTotal 885.00" },
    { claim: "4855", pet: "p5", clinic: "kierland", visit: "2026-07-09", filed: "2026-07-09T17:30:00", paid: true, docType: "invoice",
      note: "Patient: Lola, canine, Dachshund, 5 y\nDate of visit: 07/09/2026\nS: Reluctant to jump, yelped when picked up.\nO: Spinal pain at thoracolumbar junction, mild hind limb ataxia.\nA: Intervertebral disc disease, suspected.\nP: Strict crate rest, gabapentin, recheck 1 week.",
      invoice: "Exam, sick visit 1 68.00\nGabapentin capsules 30 36.00\nTotal 104.00" },
  ];

  // Test set written for this prototype: short notes with the confirmed codes a coder should assign.
  const GOLD = [
    ["A: Otitis externa, right ear.", ["SIM-1042"]],
    ["O: Ear canal red with discharge. A: 1. Otitis ext. 2. Malassezia on cytology.", ["SIM-1042", "SIM-2310"]],
    ["A: 1. Acute gastroenteritis. 2. r/o pancreatitis.", ["SIM-3101"]],
    ["A: Hot spot, left flank.", ["SIM-2304"]],
    ["A: Superficial pyoderma, ventral abdomen.", ["SIM-2303"]],
    ["A: UTI. Culture confirmed E. coli.", ["SIM-4102"]],
    ["A: Feline idiopathic cystitis.", ["SIM-4103"]],
    ["A: Blocked cat, urethral obstruction.", ["SIM-4104"]],
    ["A: CCL tear, left stifle.", ["SIM-6101"]],
    ["A: Osteoarthritis both hips. Hip dysplasia.", ["SIM-6102", "SIM-6103"]],
    ["A: Laceration, right hind paw pad.", ["SIM-7101"]],
    ["A: Bite wound, neck, from dog fight.", ["SIM-7102"]],
    ["A: Cat bite abscess, tail base.", ["SIM-7103"]],
    ["A: Kennel cough.", ["SIM-9102"]],
    ["A: Feline upper respiratory infection.", ["SIM-9101"]],
    ["A: Corneal ulcer, left eye, fluorescein positive.", ["SIM-8102"]],
    ["A: Conjunctivitis, both eyes.", ["SIM-8101"]],
    ["A: Diabetes mellitus, newly diagnosed.", ["SIM-5101"]],
    ["A: Hyperthyroidism. T4 elevated.", ["SIM-5102"]],
    ["A: Periodontal disease grade 3.", ["SIM-3201"]],
    ["A: Suspect pancreatitis, cPLI pending.", []],
    ["A: Chronic kidney disease, IRIS stage 2.", ["SIM-4105"]],
    ["A: Seizure, first episode. r/o epilepsy.", ["SIM-9302"]],
    ["A: Giardia on fecal. Diarrhea.", ["SIM-3105"]],
    ["A: Lipoma, left thorax, confirmed on aspirate.", ["SIM-2320"]],
    ["A: Anal gland impaction.", ["SIM-3107"]],
    ["A: Toxin ingestion, ate chocolate.", ["SIM-7104"]],
    ["A: Heart murmur grade 3/6. Possible HCM.", ["SIM-9201"]],
    ["A: Gastrointestinal foreign body on radiographs.", ["SIM-3103"]],
    ["A: Ear mites.", ["SIM-1050"]],
  ];

  window.CC_DATA = { VOCAB, INSURERS, CLINICS, OWNERS, PETS, VISITS, GOLD,
    VOCAB_VERSION: "SA-PDT sample (term names only; release of Sept 30, 2026 not yet downloaded; SIM- IDs are placeholders)" };
})();
