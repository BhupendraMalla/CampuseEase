"""Generate all CampusEase report diagrams from Graphviz / PlantUML sources.

Object-oriented / structured-hybrid report: produces layered architecture,
use-case, ER, DFD L0/L1, a fee-payment sequence diagram, a face-attendance
activity diagram, and an overall flowchart into figures/. Reproducible: re-run
after any design change. Requires graphviz (`dot`) and `plantuml` (Java).

Notation:
  * Use-case  -> PlantUML (stick actors, rectangle boundary, arrow-less assocs)
  * ER        -> PlantUML Information-Engineering crow's-foot
  * Sequence  -> PlantUML
  * Activity  -> PlantUML
  * DFDs      -> Graphviz, Gane-Sarson (rounded processes, plain external-entity
                 rectangles, open-ended data-store glyphs via HTML-like tables)
"""

from __future__ import annotations

import subprocess
from pathlib import Path

FIGURES = Path(__file__).parent / "figures"
FIGURES.mkdir(exist_ok=True)

_HEAD = """digraph {{
  rankdir={rankdir};
  bgcolor="white";
  fontname="Helvetica";
  node [fontname="Helvetica", fontsize=11];
  edge [fontname="Helvetica", fontsize=10];
"""


def render(name: str, dot: str) -> None:
    src = FIGURES / f"{name}.dot"
    out = FIGURES / f"{name}.png"
    src.write_text(dot)
    subprocess.run(["dot", "-Tpng", "-Gdpi=150", str(src), "-o", str(out)], check=True)
    src.unlink()
    print(f"  {out.name}")


def render_puml(name: str, puml: str) -> None:
    src = FIGURES / f"{name}.puml"
    src.write_text(puml)
    subprocess.run(["plantuml", "-tpng", "-Sdpi=150", str(src)], check=True)
    src.unlink()
    print(f"  {name}.png")


# Reusable Gane-Sarson open-ended data-store glyph (HTML-like table): a left
# "Dn" id cell divided from the store name. Only top/bottom borders drawn so the
# box reads as open-ended per Gane-Sarson convention.
def datastore(dn: str, name: str) -> str:
    return (
        '<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="6">'
        '<TR>'
        f'<TD SIDES="TB" BORDER="1" BGCOLOR="white"><B>{dn}</B></TD>'
        f'<TD SIDES="TBR" BORDER="1" BGCOLOR="white">{name}</TD>'
        '</TR></TABLE>>'
    )


# ---------------------------------------------------------------------------
# 1. Layered system architecture
# ---------------------------------------------------------------------------
ARCHITECTURE = _HEAD.format(rankdir="TB") + """
  node [shape=box, style="rounded,filled", fillcolor="white"];
  compound=true;
  nodesep=0.35; ranksep=0.55;

  subgraph cluster_client {
    label="Presentation Layer (Angular 17 SPA, Browser)";
    style="rounded,filled"; fillcolor="white"; fontsize=12;
    ui_student [label="Student Portal"];
    ui_faculty [label="Faculty Portal"];
    ui_admin [label="Admin / Secretary\\nConsole"];
    ui_charts [label="Dashboards\\n(Highcharts)"];
  }

  subgraph cluster_api {
    label="Application Layer (Node.js / Express 5 REST API + Socket.io)";
    style="rounded,filled"; fillcolor="white"; fontsize=12;
    api_auth [label="Auth & RBAC API\\n(signup / signin)"];
    api_acad [label="Academic API\\n(enroll / schedule / marks)"];
    api_att [label="Attendance API\\n(manual / face / OTP)"];
    api_fee [label="Fee API"];
    api_comm [label="Communication API\\n(chat / discussion / events)"];
  }

  subgraph cluster_logic {
    label="Business Logic Layer";
    style="rounded,filled"; fillcolor="white"; fontsize=12;
    jwt [label="JWT Auth &\\nRole Middleware"];
    face [label="Face-Recognition\\nService"];
    marks [label="Internal-Marks\\nCalculator"];
    pay [label="Payment\\nHandler"];
    mailer [label="Email / OTP\\nService"];
    hub [label="Socket Message\\nHub"];
  }

  subgraph cluster_data {
    label="Data Layer";
    style="rounded,filled"; fillcolor="white"; fontsize=12;
    odm [label="Mongoose ODM"];
    db [label="MongoDB", shape=cylinder, fillcolor="white"];
  }

  subgraph cluster_ext {
    label="External Services";
    style="rounded,filled"; fillcolor="white"; fontsize=12;
    khalti [label="Khalti\\nPayment Gateway"];
    smtp [label="SMTP\\n(Nodemailer)"];
  }

  ui_student -> api_auth [ltail=cluster_client, lhead=cluster_api, label="HTTPS / JSON, WebSocket"];
  api_auth -> jwt [lhead=cluster_logic, label="verify"];
  api_fee -> pay [label="charge"];
  api_att -> face [label="enrol / match"];
  api_acad -> marks [label="compute"];
  api_comm -> hub [label="emit"];
  api_auth -> mailer [label="verify / OTP"];
  pay -> khalti [label="REST"];
  mailer -> smtp [label="send mail"];
  jwt -> odm [lhead=cluster_data, label="query"];
  marks -> odm;
  hub -> odm [label="persist"];
  odm -> db;
}
"""

# ---------------------------------------------------------------------------
# 2. Use-case diagram (PlantUML: stick actors, rectangle boundary,
#    associations with NO arrowheads)
# ---------------------------------------------------------------------------
USE_CASE_PUML = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam DefaultFontName Helvetica
skinparam DefaultFontSize 13
skinparam dpi 150
left to right direction
skinparam ArrowColor black
skinparam ActorBorderColor black
skinparam UsecaseBorderColor black
skinparam RectangleBorderColor black
skinparam packageStyle rectangle

actor "Student" as Student
actor "Faculty" as Faculty
actor "Admin /\\nSecretary" as Admin

rectangle "CampusEase" {
  usecase "Register / Sign In" as UC0
  usecase "Enroll in Subjects" as UC1
  usecase "Mark Face Attendance" as UC2
  usecase "Submit Assignment" as UC3
  usecase "View Marks & Records" as UC4
  usecase "Pay Fees Online" as UC5
  usecase "Chat & Discuss" as UC6
  usecase "Join Clubs / Events" as UC7
  usecase "Post Assignment\\n& Enter Marks" as UC8
  usecase "Manage Class Schedule" as UC9
  usecase "Take Attendance" as UC10
  usecase "Manage Users" as UC11
  usecase "Approve Fees" as UC12
  usecase "Manage Departments\\n& Enrollment Keys" as UC13
  usecase "Generate ID Card\\n& Reports" as UC14
}

actor "Khalti\\nGateway" as Khalti
actor "Email\\nService" as Email

Student -- UC0
Student -- UC1
Student -- UC2
Student -- UC3
Student -- UC4
Student -- UC5
Student -- UC6
Student -- UC7

Faculty -- UC0
Faculty -- UC8
Faculty -- UC9
Faculty -- UC10
Faculty -- UC6

Admin -- UC11
Admin -- UC12
Admin -- UC13
Admin -- UC14

UC0 ..> Email : <<include>>
UC5 ..> Khalti : <<include>>
UC5 ..> UC12 : <<extend>>
UC3 ..> UC8 : <<extend>>
@enduml
"""

# ---------------------------------------------------------------------------
# 3. ER diagram (PlantUML Information-Engineering crow's-foot)
# ---------------------------------------------------------------------------
ER_PUML = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam DefaultFontName Helvetica
skinparam DefaultFontSize 12
skinparam dpi 150
skinparam linetype ortho
hide circle

entity "User" as User {
  * _id : ObjectId <<PK>>
  --
  * email : String <<unique>>
  * name : String
  * password : String
  rollno : Number
  role : String
  department : String
  isVerified : Boolean
}

entity "EnrollmentSubjects" as Enroll {
  * _id : ObjectId <<PK>>
  --
  enrollment_key : String
  semester : String
  department : String
  subjects : Array
}

entity "Attendance" as Att {
  * _id : ObjectId <<PK>>
  --
  email : String
  rollno : Number
  subject : String
  date : String
  remarks : String
}

entity "GiveAssignment" as Give {
  * _id : ObjectId <<PK>>
  --
  subject : String
  assignmentName : String
  assignmentFile : String
  dueDate : Date
}

entity "AnswerAssignment" as Ans {
  * _id : ObjectId <<PK>>
  --
  subject : String
  assignment : String
  assignmentFile : String
  rollno : Number
  submitteddate : Date
}

entity "MarksEntry" as Marks {
  * _id : ObjectId <<PK>>
  --
  * studentId : ObjectId <<FK>>
  * teacherId : ObjectId <<FK>>
  subjectName : String
  marks : Number
  marksType : String
}

entity "Fee" as Fee {
  * _id : ObjectId <<PK>>
  --
  * studentId : ObjectId <<FK>>
  amount : Number
  method : String
  status : String
  receiptNumber : String
}

entity "Message" as Msg {
  * _id : ObjectId <<PK>>
  --
  * sender : ObjectId <<FK>>
  * receiver : ObjectId <<FK>>
  message : String
  isRead : Boolean
  timestamp : Date
}

' Crow's-foot cardinalities (Information Engineering)
User   }o--o{ Enroll : enrolls in
User   ||--o{ Att    : records
User   ||--o{ Give   : posts
User   ||--o{ Ans    : submits
User   ||--o{ Marks  : enters
User   ||--o{ Marks  : receives
User   ||--o{ Fee    : pays
User   ||--o{ Msg    : sends
Give   ||--o{ Ans    : answered by
@enduml
"""

# ---------------------------------------------------------------------------
# 4. DFD Level 0 (context) -- Gane-Sarson
# ---------------------------------------------------------------------------
DFD0 = _HEAD.format(rankdir="LR") + """
  // External entities: plain rectangles
  node [shape=box, style="filled", fillcolor="white", color="black"];
  student [label="Student /\\nFaculty"];
  admin   [label="Admin /\\nSecretary"];
  khalti  [label="Khalti\\nGateway"];
  email   [label="Email\\nService"];

  // Process: rounded rectangle, numbered (0 = context)
  proc [shape=box, style="rounded,filled", fillcolor="white",
        label="0\\n\\nCampusEase", width=2.0, height=1.2];

  student -> proc [label="credentials, assignments,\\nattendance, fee requests"];
  proc -> student [label="schedules, marks,\\nrecords, notifications"];
  admin -> proc   [label="management commands"];
  proc -> admin   [label="reports, approvals"];
  proc -> khalti  [label="payment init"];
  khalti -> proc  [label="payment confirmation"];
  proc -> email   [label="verification / OTP"];
}
"""

# ---------------------------------------------------------------------------
# 5. DFD Level 1 -- Gane-Sarson
# ---------------------------------------------------------------------------
DFD1 = _HEAD.format(rankdir="TB") + """
  // External entities
  node [shape=box, style="filled", fillcolor="white", color="black"];
  user   [label="Student / Faculty"];
  admin  [label="Admin / Secretary"];
  khalti [label="Khalti Gateway"];

  // Processes: numbered rounded rectangles
  node [shape=box, style="rounded,filled", fillcolor="white", color="black"];
  p1 [label="1\\n\\nAuthenticate &\\nAuthorize", width=1.7, height=1.0];
  p2 [label="2\\n\\nManage\\nAcademics", width=1.7, height=1.0];
  p3 [label="3\\n\\nRecord\\nAttendance", width=1.7, height=1.0];
  p4 [label="4\\n\\nManage Assignments\\n& Marks", width=1.7, height=1.0];
  p5 [label="5\\n\\nProcess Fee\\nPayment", width=1.7, height=1.0];
  p6 [label="6\\n\\nCommunication\\n& Engagement", width=1.7, height=1.0];

  // Data stores: open-ended Gane-Sarson glyph
  node [shape=plaintext, style="", fillcolor="white"];
  d1 [label=DS1];
  d2 [label=DS2];
  d3 [label=DS3];
  d4 [label=DS4];
  d5 [label=DS5];
  d6 [label=DS6];

  user -> p1   [label="credentials"];
  p1 -> d1     [dir=both, label="verify / store"];
  admin -> p2  [label="schedule, enrollment"];
  p2 -> d2     [dir=both, label="academic records"];
  user -> p3   [label="face / OTP"];
  p3 -> d3     [label="attendance"];
  user -> p4   [label="submissions"];
  p4 -> d4     [dir=both, label="marks / files"];
  d3 -> p4     [label="attendance marks"];
  user -> p5   [label="fee request"];
  p5 -> khalti [label="charge"];
  khalti -> p5 [label="confirmation"];
  p5 -> d5     [label="fee records"];
  admin -> p5  [label="approve"];
  user -> p6   [label="messages, posts"];
  p6 -> d6     [dir=both, label="chat / events / clubs"];
  p2 -> user   [label="schedules"];
  p4 -> user   [label="results"];
}
""".replace("DS1", datastore("D1", "Users")) \
   .replace("DS2", datastore("D2", "Academic Records")) \
   .replace("DS3", datastore("D3", "Attendance")) \
   .replace("DS4", datastore("D4", "Assignments &amp; Marks")) \
   .replace("DS5", datastore("D5", "Fees")) \
   .replace("DS6", datastore("D6", "Messages &amp; Activities"))

# ---------------------------------------------------------------------------
# 6. Sequence diagram -- online fee payment via Khalti
# ---------------------------------------------------------------------------
SEQUENCE_PUML = """@startuml
<style>
lifeLine {
  LineStyle 2-4
  LineColor black
}
</style>
skinparam monochrome true
skinparam shadowing false
skinparam DefaultFontName Helvetica
skinparam DefaultFontSize 12
skinparam dpi 150
skinparam sequenceMessageAlign center

actor Student
participant "Angular SPA" as SPA
participant "Express API" as API
participant "Khalti\\nGateway" as Khalti
database "MongoDB" as DB
actor "Admin /\\nFinance Officer" as Admin

Student -> SPA : select fee, click Pay
SPA -> Khalti : initiate payment (amount)
Khalti --> SPA : payment token (success)
SPA -> API : POST /payFee {amount, token}
API -> DB : insert Fee (status = Pending)
DB --> API : receiptNumber
API --> SPA : payment recorded
SPA --> Student : show receipt

== Approval ==
Admin -> API : PATCH /approveFee/:id
API -> DB : update status = Paid
DB --> API : ok
API --> Admin : confirmation
@enduml
"""

# ---------------------------------------------------------------------------
# 7. Activity diagram -- face-recognition attendance
# ---------------------------------------------------------------------------
ACTIVITY_PUML = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam DefaultFontName Helvetica
skinparam DefaultFontSize 13
skinparam dpi 150

start
:Student opens Attendance;
if (Face already registered?) then (no)
  :Capture face via webcam;
  :Store face encoding;
else (yes)
endif
:Capture live face image;
:Compare with stored encoding;
if (Match and confidence high?) then (yes)
  :Mark attendance = Present;
  :Persist record\\n(rollno, subject, date);
  :Show confirmation;
else (no)
  :Reject attempt;
  :Prompt to retry;
endif
stop
@enduml
"""

# ---------------------------------------------------------------------------
# 8. Flowchart -- overall control / data flow
# ---------------------------------------------------------------------------
FLOWCHART = _HEAD.format(rankdir="TB") + """
  node [shape=box, style="rounded,filled", fillcolor="white"];

  start [shape=oval, fillcolor="white", label="User accesses\\nCampusEase"];
  auth [shape=diamond, fillcolor="white", label="Authenticated?"];
  login [label="Sign in / Register\\n(email verify, OTP)"];
  role [shape=diamond, fillcolor="white", label="Role?"];

  student [label="Student portal:\\nenroll, attendance,\\nassignments, fees,\\nmarks, chat"];
  faculty [label="Faculty portal:\\nschedule, attendance,\\nassignments, marks,\\nmodel questions"];
  admin [label="Admin / Secretary:\\nuser mgmt, fee approval,\\ndepartments, events,\\nID cards, reports"];

  action [label="Perform action\\n(REST API call)"];
  authz [shape=diamond, fillcolor="white", label="Role permitted?"];
  deny [label="Reject (403)", fillcolor="white"];
  persist [label="Validate & persist\\nvia Mongoose / MongoDB"];
  realtime [shape=diamond, fillcolor="white", label="Real-time\\nupdate?"];
  emit [label="Emit via Socket.io\\n(chat / notification)"];
  respond [label="Update UI &\\ndashboards"];
  end [shape=oval, fillcolor="white", label="End"];

  start -> auth;
  auth -> login [label="No"];
  login -> auth;
  auth -> role [label="Yes"];
  role -> student [label="Student"];
  role -> faculty [label="Faculty"];
  role -> admin [label="Admin"];
  student -> action;
  faculty -> action;
  admin -> action;
  action -> authz;
  authz -> deny [label="No"];
  deny -> respond;
  authz -> persist [label="Yes"];
  persist -> realtime;
  realtime -> emit [label="Yes"];
  realtime -> respond [label="No"];
  emit -> respond;
  respond -> end;
}
"""


def main() -> None:
    print("Rendering CampusEase diagrams...")
    render("architecture", ARCHITECTURE)
    render_puml("use_case_diagram", USE_CASE_PUML)
    render_puml("er_diagram", ER_PUML)
    render("dfd_level0", DFD0)
    render("dfd_level1", DFD1)
    render_puml("sequence_diagram", SEQUENCE_PUML)
    render_puml("activity_diagram", ACTIVITY_PUML)
    render("flowchart", FLOWCHART)
    print("Done.")


if __name__ == "__main__":
    main()
