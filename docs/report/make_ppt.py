"""Build the CampusEase final-defense presentation.

Reproducible: re-run to regenerate campusease_presentation.pptx. Reuses the
institutional template theme (template_base.pptx) for background/fonts/footer,
but lays out every slide with explicit, controlled geometry (manual title band +
body box + fitted images) so nothing clips or overlaps. Structured-approach
order (Use-Case, ER, DFD). Requires python-pptx + opencv.
"""

from __future__ import annotations

from pathlib import Path

import cv2
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

BASE = Path(__file__).resolve().parent
TEMPLATE = BASE / "template_base.pptx"   # institutional theme (background/fonts/footer)
FIG = BASE / "figures"
OUT = BASE / "campusease_presentation.pptx"

NAVY = RGBColor(0x12, 0x33, 0x5B)
INK = RGBColor(0x20, 0x20, 0x20)
ACCENT = RGBColor(0x2E, 0x6F, 0xB5)

prs = Presentation(str(TEMPLATE))
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[10]

MARGIN = Inches(0.55)
TITLE_TOP = Inches(0.35)
TITLE_H = Inches(0.85)
BODY_TOP = Inches(1.35)
BODY_H = SH - BODY_TOP - Inches(0.95)  # leave room for the template footer logos
CONTENT_W = SW - 2 * MARGIN


def _new_slide():
    s = prs.slides.add_slide(BLANK)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    return s


def _add_title(slide, text: str) -> None:
    tb = slide.shapes.add_textbox(MARGIN, TITLE_TOP, CONTENT_W, TITLE_H)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = NAVY
    line = slide.shapes.add_shape(1, MARGIN, TITLE_TOP + TITLE_H, Inches(2.2), Pt(3))
    line.fill.solid(); line.fill.fore_color.rgb = ACCENT
    line.line.fill.background(); line.shadow.inherit = False


def bullet_slide(title: str, bullets: list[tuple[int, str]]) -> None:
    s = _new_slide()
    _add_title(s, title)
    tb = s.shapes.add_textbox(MARGIN, BODY_TOP, CONTENT_W, BODY_H)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
    for i, (level, text) in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = ("•  " if level == 0 else "◦  ") + text
        p.level = level
        p.font.size = Pt(17 if level == 0 else 14)
        p.font.color.rgb = INK
        p.space_after = Pt(7 if level == 0 else 3)
        p.line_spacing = 1.05


def _fit(img: Path, max_w: int, max_h: int) -> tuple[int, int]:
    h, w = cv2.imread(str(img)).shape[:2]
    ar = w / h
    width, height = max_w, int(max_w / ar)
    if height > max_h:
        height, width = max_h, int(max_h * ar)
    return width, height


def image_slide(title: str, images: list[Path], captions: list[str] | None = None) -> None:
    s = _new_slide()
    _add_title(s, title)
    n = len(images)
    gap = Inches(0.3)
    cap_h = Inches(0.3) if captions else Inches(0.0)
    cell_w = int((CONTENT_W - gap * (n - 1)) / n)
    area_h = int(BODY_H - cap_h)
    x = MARGIN
    for k, img in enumerate(images):
        w, h = _fit(img, cell_w, area_h)
        s.shapes.add_picture(str(img), x + (cell_w - w) // 2, BODY_TOP + (area_h - h) // 2, width=w, height=h)
        if captions:
            cb = s.shapes.add_textbox(x, BODY_TOP + area_h, cell_w, cap_h)
            cp = cb.text_frame.paragraphs[0]
            cp.text = captions[k]; cp.alignment = PP_ALIGN.CENTER
            cp.font.size = Pt(12); cp.font.color.rgb = INK
        x += cell_w + gap


def title_slide() -> None:
    s = _new_slide()
    tf = s.shapes.add_textbox(MARGIN, Inches(1.3), CONTENT_W, Inches(3.0)).text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    rows = [
        ("CampusEase", 38, True, NAVY, 6),
        ("A Web-Based College Automation System for", 17, False, INK, 0),
        ("Academic and Administrative Management", 17, False, INK, 14),
        ("Bhupendra Malla, BIT 8th Semester (LC0003001648)", 16, False, INK, 2),
        ("Supervisor: Mr. Saishab Bhattarai", 15, False, INK, 2),
        ("Phoenix College of Management", 15, False, ACCENT, 0),
    ]
    for i, (text, size, bold, color, after) in enumerate(rows):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = text; p.alignment = PP_ALIGN.CENTER
        p.font.size = Pt(size); p.font.bold = bold; p.font.color.rgb = color
        p.space_after = Pt(after)


# Drop the template's own slides; keep only its theme/master.
_sldIdLst = prs.slides._sldIdLst
for sid in list(_sldIdLst):
    prs.part.drop_rel(sid.get(qn("r:id")))
    _sldIdLst.remove(sid)

title_slide()

bullet_slide("Introduction", [
    (0, "Colleges run on many disconnected processes: enrollment, attendance, marks, fees, notices, communication."),
    (0, "Most are still manual or spread across spreadsheets, paper, and separate tools."),
    (1, "Data is duplicated, hard to track, and slow to act on for students, faculty, and staff."),
    (0, "CampusEase: a single web platform that centralises academic and administrative operations."),
    (0, "Role-based portals for students, faculty, secretaries, and administrators with automated services."),
])

bullet_slide("Problem Statement", [
    (0, "College operations are fragmented and largely manual:"),
    (1, "Enrollment, attendance, and marks are tracked by hand or in disconnected files."),
    (1, "Fee collection lacks a digital, trackable, approval-based workflow."),
    (1, "Communication (notices, messaging, events) is scattered across channels."),
    (1, "No single role-aware portal, so each user juggles multiple systems."),
    (0, "Need: one secure, role-based web system that unifies these workflows and automates routine tasks."),
])

bullet_slide("Objectives", [
    (0, "General: a web-based college automation system that centralises academic and administrative operations with role-based, automated services."),
    (0, "Specific objectives:"),
    (1, "Design role-based access control for students, faculty, secretaries, and administrators."),
    (1, "Implement subject enrollment, class scheduling, and academic-record management."),
    (1, "Provide manual, OTP, and face-recognition attendance methods."),
    (1, "Automate assignments, marks entry, and internal-marks calculation."),
    (1, "Integrate secure online fee payment via Khalti with an admin approval workflow."),
    (1, "Enable real-time messaging, discussion forums, events, and clubs."),
])

bullet_slide("Functional Requirements", [
    (0, "Role-based registration, email/OTP verification, and authentication."),
    (0, "Subject enrollment via enrollment keys, class scheduling, academic records."),
    (0, "Attendance by manual entry, one-time password, and face recognition."),
    (0, "Assignment distribution/submission, marks entry, automatic internal-marks calculation."),
    (0, "Online fee payment via Khalti with status tracking and admin approval."),
    (0, "Real-time messaging, discussion forums, events, clubs, job/CV portal, digital ID cards."),
])

bullet_slide("Non-functional Requirements", [
    (0, "Performance: respond to typical actions within a few seconds at institution scale."),
    (0, "Usability: role-specific dashboards usable with basic technical knowledge."),
    (0, "Security: bcrypt-hashed passwords, JWT auth, role- and department-based access control."),
    (0, "Reliability: consistent data via Mongoose schemas and validation."),
    (0, "Maintainability and portability: modular Angular + Express, runs on any Node.js runtime."),
])

image_slide("Requirement Modeling: Use-Case Diagram", [FIG / "use_case_diagram.png"])
image_slide("Data Modeling: ER Diagram", [FIG / "er_diagram.png"])
image_slide("Process Modeling: Data Flow Diagrams",
            [FIG / "dfd_level0.png", FIG / "dfd_level1.png"],
            ["Level 0 (context)", "Level 1"])
image_slide("System Architecture", [FIG / "architecture.png"])
image_slide("Behavioural Modeling: Activity & Sequence",
            [FIG / "activity_diagram.png", FIG / "sequence_diagram.png"],
            ["Activity diagram", "Sequence diagram"])

bullet_slide("Implementing Tools", [
    (0, "Angular + TypeScript: role-specific single-page frontend portals."),
    (0, "Node.js + Express: REST API; Socket.io for real-time messaging and presence."),
    (0, "MongoDB + Mongoose: document database with schema-based data access."),
    (0, "JWT + bcrypt: stateless authentication and one-way password hashing."),
    (0, "Multer (uploads), Nodemailer (verification/OTP email), Highcharts (dashboards)."),
    (0, "Khalti: external gateway for online fee payment. Git/GitHub, VS Code, Angular CLI."),
])

bullet_slide("Implementation: Module Details", [
    (0, "Authentication & Role: registration, email verification, JWT login, RBAC middleware by role/department."),
    (0, "Academic: enrollment-key based subject enrollment, class scheduling, academic records."),
    (0, "Attendance: manual roll, short-lived OTP, and webcam face-recognition matching."),
    (0, "Assignments & Marks: post/submit assignments, marks entry, automatic internal-marks calculation."),
    (0, "Fee Payment: Khalti-initiated online payment, receipt + status, admin/finance approval."),
    (0, "Communication & Admin: Socket.io messaging, forums/events/clubs, user/department management, job-CV portal, digital ID cards."),
])

bullet_slide("Key Workflows", [
    (0, "Role-based access control: JWT carries role + department; middleware gates every endpoint."),
    (0, "Khalti payment: frontend -> backend initiate -> Khalti checkout -> return callback -> lookup verify -> fee marked Paid."),
    (0, "Internal marks: assignment marks + attendance marks combined into a computed internal score."),
    (0, "Attendance OTP: server issues a 5-minute code; student submits it (with location) to mark present."),
])

image_slide("Application Demo: Admin Dashboard", [FIG / "app_admin_dashboard.png"])
image_slide("Application Demo: User Management", [FIG / "app_user_management.png"])

bullet_slide("Conclusion", [
    (0, "A complete, working platform unifying enrollment, attendance, assignments, marks, fees, and communication."),
    (0, "Role-based portals, three attendance methods, automatic internal marks, and verified Khalti online payment."),
    (0, "Real-time messaging and engagement features, with secure JWT auth and per-role access control."),
    (0, "All unit and system test cases passed; end-to-end tested across every role."),
    (0, "Future work: real-time analytics, mobile app, ML-based insights, and multi-campus scaling."),
])

prs.save(str(OUT))
print(f"Wrote {OUT}  ({len(prs.slides)} slides)")
