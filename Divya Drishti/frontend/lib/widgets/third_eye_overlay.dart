import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

class ThirdEyeOverlay extends StatelessWidget {
  final Map<String, dynamic> data;

  const ThirdEyeOverlay({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final metadata = data['metadata'] as Map<String, dynamic>? ?? {};
    final stego = data['steganography'] as Map<String, dynamic>? ?? {};
    final hashes = data['hashes'] as Map<String, dynamic>? ?? {};
    final detected = stego['detected'] == true;

    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.all(20),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Cyberpunk Glass Container
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF0F121C).withOpacity(0.95),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Theme.of(context).primaryColor, width: 2),
              boxShadow: [
                BoxShadow(
                  color: Theme.of(context).primaryColor.withOpacity(0.4),
                  blurRadius: 30,
                  spreadRadius: 2,
                )
              ],
            ),
            padding: const EdgeInsets.all(24),
            constraints: const BoxConstraints(maxWidth: 700, maxHeight: 800),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                         const Icon(Icons.remove_red_eye_outlined, color: Colors.cyanAccent),
                         const SizedBox(width: 10),
                         Text("DIVYA DRISHTI // ANALYSIS REPORT", 
                          style: GoogleFonts.rajdhani(
                            color: Colors.white, 
                            fontWeight: FontWeight.bold, 
                            letterSpacing: 3,
                            fontSize: 20
                          )
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    )
                  ],
                ),
                const Divider(color: Colors.white24),
                
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    children: [
                      // Status Header
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: detected ? Colors.red.withOpacity(0.2) : Colors.green.withOpacity(0.2),
                          border: Border.all(color: detected ? Colors.redAccent : Colors.greenAccent),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            Icon(detected ? Icons.warning : Icons.verified_user, 
                                 size: 40, 
                                 color: detected ? Colors.redAccent : Colors.greenAccent),
                            const SizedBox(width: 20),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(detected ? "THREAT DETECTED" : "INTEGRITY VERIFIED", 
                                  style: GoogleFonts.rajdhani(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                                Text(detected ? "Steganographic anomalies found." : "No hidden data detected.",
                                  style: const TextStyle(color: Colors.white70)),
                              ],
                            ),
                          ],
                        ),
                      ).animate().slideY(begin: 0.2, end: 0, duration: 400.ms),

                      const SizedBox(height: 20),

                      // Hashes Section (Critical for Forensics)
                      _buildSectionHeader("EVIDENCE INTEGRITY (HASH)", Colors.cyanAccent)
                          .animate().fadeIn(delay: 200.ms),
                      if (hashes.isNotEmpty) ...[
                        _buildInfoTile("SHA-256", hashes['sha256'], isMono: true).animate().slideX(delay: 300.ms),
                        _buildInfoTile("MD5", hashes['md5'], isMono: true).animate().slideX(delay: 400.ms),
                      ] else 
                        const Text("Hash calculation failed", style: TextStyle(color: Colors.red)).animate().fadeIn(),


                      // Digital DNA (Magic Bytes)
                      if (data.containsKey('metadata') && data['metadata']['digital_dna'] != null) ...[
                        _buildSectionHeader("DIGITAL DNA (SPOOF CHECK)", Colors.purpleAccent),
                        Builder(
                          builder: (context) {
                            final dna = data['metadata']['digital_dna'];
                            final match = dna['integrity_check'] == "MATCH";
                            return Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                border: Border.all(color: match ? Colors.green : Colors.red),
                                borderRadius: BorderRadius.circular(8)
                              ),
                              child: Column(
                                children: [
                                  _buildInfoTile("Declared Ext", dna['declared_extension']),
                                  _buildInfoTile("Detected MIME", dna['detected_mime']),
                                  const SizedBox(height: 5),
                                  Text(match ? "✅ SIGNATURE MATCHED" : "⚠️ SUSPICIOUS MISMATCH", 
                                    style: TextStyle(
                                      color: match ? Colors.green : Colors.red, 
                                      fontWeight: FontWeight.bold
                                    )
                                  )
                                ],
                              ),
                            );
                          }
                        ),
                        const SizedBox(height: 20),
                      ],
                      
                      // Face Detection Results
                      if (data.containsKey('vision') && data['vision']['faces_detected'] > 0) ...[
                        _buildSectionHeader("SUSPECT RECOGNITION (CV)", Colors.blueAccent),
                        _buildInfoTile("Entities Detected", "${data['vision']['faces_detected']}"),
                        const Text(">> Facial signatures identified. Cross-referencing database... [OFFLINE]", 
                          style: TextStyle(color: Colors.white30, fontSize: 10)),
                        const SizedBox(height: 20),
                      ],

                      // Timeline
                      if (data.containsKey('metadata') && data['metadata']['timeline'] != null) ...[
                        _buildSectionHeader("CHRONOS TIMELINE", Colors.tealAccent),
                        ...((data['metadata']['timeline'] as List).map((e) => 
                          Padding(
                             padding: const EdgeInsets.only(bottom: 8.0, left: 10),
                             child: Row(
                               children: [
                                 const Icon(Icons.circle, size: 8, color: Colors.tealAccent),
                                 const SizedBox(width: 10),
                                 Expanded(
                                   child: Column(
                                     crossAxisAlignment: CrossAxisAlignment.start,
                                     children: [
                                       Text(e['event'], style: const TextStyle(color: Colors.white70, fontSize: 12)),
                                       Text(e['timestamp'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                     ],
                                   ),
                                 )
                               ],
                             ),
                          )
                        )),
                        const SizedBox(height: 20),
                      ],

                      // Stego Details
                      if (detected) ...[
                        _buildSectionHeader("ANOMALY DETAILS", Colors.redAccent),
                        _buildInfoTile("Method", stego['method']),
                        _buildInfoTile("Confidence", "${(stego['confidence'] * 100).toStringAsFixed(1)}%"),
                        ...((stego['details'] as List?)?.map((d) => Text(">> $d", style: GoogleFonts.robotoMono(color: Colors.redAccent))) ?? []),
                        const SizedBox(height: 20),
                      ],

                      // Metadata Section
                      if (metadata.containsKey('file_info')) ...[
                        _buildSectionHeader("FILE METADATA", Colors.amberAccent),
                        _buildInfoTile("MIME Type", metadata['file_info']['mime_type']),
                        _buildInfoTile("Size", "${metadata['file_info']['size_bytes']} bytes"),
                      ],
                      
                      const SizedBox(height: 10),
                      
                      if (metadata.containsKey('exif') && (metadata['exif'] as Map).isNotEmpty) ...[
                        _buildSectionHeader("EXIF DATA", Colors.orangeAccent),
                        ...(metadata['exif'] as Map).entries.map((e) => _buildInfoTile(e.key, e.value.toString())).take(10), // Limit to 10
                      ],

                      if (metadata.containsKey('gps') && (metadata['gps'] as Map).isNotEmpty) ...[
                        const SizedBox(height: 10),
                         _buildSectionHeader("GEOLOCATION", Colors.pinkAccent),
                        _buildInfoTile("Latitude", metadata['gps']['latitude']),
                        _buildInfoTile("Longitude", metadata['gps']['longitude']),
                      ]
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 10),
      child: Row(
        children: [
          Container(width: 4, height: 16, color: color),
          const SizedBox(width: 8),
          Text(
            title,
            style: GoogleFonts.rajdhani(color: color, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile(String label, String? value, {bool isMono = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 140, child: Text(label, style: const TextStyle(color: Colors.white54, fontSize: 13))),
          Expanded(child: SelectableText( // Copyable text
            value ?? "N/A", 
            style: isMono 
              ? GoogleFonts.robotoMono(color: Colors.white, fontSize: 12)
              : const TextStyle(color: Colors.white, fontSize: 14)
          )),
        ],
      ),
    );
  }
}
