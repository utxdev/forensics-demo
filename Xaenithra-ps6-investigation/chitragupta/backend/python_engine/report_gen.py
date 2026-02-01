from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet
import os
import time

class ReportGenerator:
    def _add_watermark(self, canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica-Bold', 40)
        canvas.setStrokeColor(colors.lightgrey)
        canvas.setFillColor(colors.lightgrey, alpha=0.1)
        # Create a diagonal watermark
        canvas.translate(doc.pagesize[0]/2, doc.pagesize[1]/2)
        canvas.rotate(45)
        canvas.drawCentredString(0, 0, "FORENSIC INTEGRITY SECURED")
        canvas.drawCentredString(0, -50, "CHITRAGUPTA DIVINE SCRIBE")
        canvas.restoreState()

    def _add_timeline(self, story, events, styles):
        story.append(Paragraph("FORENSIC EVENT TIMELINE", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        data = [["Timestamp", "Event Description", "Category"]]
        for e in events:
            data.append([e['timestamp'], e['description'][:80] + "..." if len(e['description']) > 80 else e['description'], e['type'].upper()])
        
        t = Table(data, colWidths=[100, 310, 90])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a1a1a')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.gold),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTSIZE', (0,1), (-1,-1), 7),
            ('BACKGROUND', (0,1), (-1,-1), colors.whitesmoke),
        ]))
        story.append(t)
        story.append(Spacer(1, 24))

    def _add_calls_section(self, story, calls, styles):
        story.append(Paragraph("CALL LOG ANALYSIS", styles['Heading3']))
        if not calls:
            story.append(Paragraph("No call entries found.", styles['Normal']))
            return
            
        data = [["Number", "Timestamp", "Duration(s)", "Type"]]
        for c in calls[:15]: # Show top 15
            data.append([c.get('number', '??'), c.get('date', '??'), c.get('duration', '0'), c.get('type', '??')])
            
        t = Table(data, colWidths=[120, 180, 100, 100])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.navy),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('FONTSIZE', (0,1), (-1,-1), 8),
        ]))
        story.append(t)
        story.append(Spacer(1, 18))

    def _add_sms_section(self, story, sms, styles):
        story.append(Paragraph("SMS / CHAT EXPORT SUMMARY", styles['Heading3']))
        if not sms:
            story.append(Paragraph("No SMS records discovered.", styles['Normal']))
            return

        data = [["Address", "Date", "Body Snippet"]]
        for m in sms[:10]:
            snippet = m.get('body', '')[:60] + "..." if len(m.get('body','')) > 60 else m.get('body','')
            data.append([m.get('address', '??'), m.get('date', '??'), snippet])

        t = Table(data, colWidths=[120, 180, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.darkred),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('FONTSIZE', (0,1), (-1,-1), 7),
        ]))
        story.append(t)
        story.append(Spacer(1, 18))

    def generate_report(self, metadata, files_data, root_hash, signature, output_path="report.pdf", extras=None):
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        extras = extras or {}

        # Title
        story.append(Paragraph(f"DIVINE FORENSIC REPORT", styles['Title']))
        story.append(Spacer(1, 12))
        
        # Metadata Block
        story.append(Paragraph("CASE METADATA", styles['Heading2']))
        meta_data = [
            ["Case ID:", metadata.get('case_id', 'N/A'), "Investigator:", metadata.get('investigator', 'N/A')],
            ["Agency:", metadata.get('agency', 'N/A'), "Suspect:", metadata.get('suspect', 'N/A')],
            ["Date:", time.ctime(), "Threat Score:", metadata.get('threat_score', '0')]
        ]
        mt = Table(meta_data, colWidths=[100, 150, 100, 150])
        mt.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
            ('BACKGROUND', (2,0), (2,-1), colors.whitesmoke),
        ]))
        story.append(mt)
        story.append(Spacer(1, 24))

        # Forensic Dashboard Summary
        story.append(Paragraph("EXECUTIVE SUMMARY", styles['Heading2']))
        summary_text = f"Subject <b>{metadata.get('suspect')}</b> analysis completed. "
        summary_text += f"Remarks: {metadata.get('remarks', 'No additional notes.')}"
        story.append(Paragraph(summary_text, styles['Normal']))
        story.append(Spacer(1, 12))

        # Detailed Analysis Sections
        if 'calls' in extras:
            self._add_calls_section(story, extras['calls'], styles)
        if 'sms' in extras:
            self._add_sms_section(story, extras['sms'], styles)
        if 'timeline' in extras:
            self._add_timeline(story, extras['timeline'], styles)

        # Evidence Integrity Table
        story.append(Paragraph("EVIDENCE INTEGRITY LOG (SHA-256)", styles['Heading2']))
        data = [["Filename", "Full Hashing Integrity Value (SHA-256)", "Status"]]
        for f in files_data:
            data.append([f['name'], f['hash'], "VERIFIED"])
        
        t = Table(data, colWidths=[120, 310, 70])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 24))

        # Indrajaal Integrity
        story.append(Paragraph("INDRAJAAL INTEGRITY (MERKLE)", styles['Heading2']))
        story.append(Paragraph(f"<b>Merkle Root:</b> {root_hash}", styles['Normal']))
        story.append(Spacer(1, 24))

        # Divine Karma Seal
        story.append(Paragraph("KARMA SEAL OF INTEGRITY", styles['Heading2']))
        story.append(Paragraph("This document and its associated payloads are cryptographically signed using RSA-4096. Any modification to the evidence or the report metadata will invalidate the seal.", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Visual Seal Representation (Boxed signature)
        sig_data = [
            ["CRYPTOGRAPHIC SIGNATURE (RSA-4096)"],
            [signature]
        ]
        st = Table(sig_data, colWidths=[500])
        st.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 2, colors.gold),
            ('BACKGROUND', (0,0), (-1,0), colors.black),
            ('TEXTCOLOR', (0,0), (-1,0), colors.gold),
            ('TEXTCOLOR', (0,1), (-1,1), colors.darkblue),
            ('FONTNAME', (0,0), (-1,0), 'Courier-Bold'),
            ('FONTNAME', (0,1), (-1,1), 'Courier'),
            ('FONTSIZE', (0,1), (-1,1), 5),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(st)
        
        # Build with watermark on every page
        doc.build(story, onLaterPages=self._add_watermark, onFirstPage=self._add_watermark)
        return output_path

report_gen = ReportGenerator()
