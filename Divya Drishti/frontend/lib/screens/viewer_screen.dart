import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/hex_viewer.dart';
import '../widgets/third_eye_overlay.dart';

class ViewerScreen extends StatefulWidget {
  const ViewerScreen({super.key});

  @override
  State<ViewerScreen> createState() => _ViewerScreenState();
}

class _ViewerScreenState extends State<ViewerScreen> {
  PlatformFile? _selectedFile;
  Map<String, dynamic>? _analysisResult;
  bool _isAnalyzing = false;
  bool _showThirdEyeRequest = false;
  
  // Backend URL (Use localhost:8000 for web)
  final String _backendUrl = "http://127.0.0.1:8000"; 

  Future<void> _pickFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      withData: true, // Important for Web
    );

    if (result != null) {
      setState(() {
        _selectedFile = result.files.first;
        _analysisResult = null;
        _showThirdEyeRequest = false;
      });
      await _analyzeFile();
    }
  }

  Future<void> _analyzeFile() async {
    if (_selectedFile == null) return;
    if (_selectedFile!.bytes == null) return;

    setState(() {
      _isAnalyzing = true;
    });

    try {
      var request = http.MultipartRequest('POST', Uri.parse('$_backendUrl/analyze'));
      
      // Determine media type manually or let it be auto-inferred
      // For web, bytes are available
        request.files.add(http.MultipartFile.fromBytes(
          'file',
          _selectedFile!.bytes!,
          filename: _selectedFile!.name,
          contentType: MediaType('application', 'octet-stream'), 
        ));

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        setState(() {
          _analysisResult = jsonDecode(response.body);
          // Show third eye if stego detected or just as a feature
          _showThirdEyeRequest = true; 
        });
      } else {
        debugPrint("Analysis failed: ${response.body}");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Analysis failed: ${response.statusCode}')),
        );
      }
    } catch (e) {
      debugPrint("Error: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error connecting to backend: $e')),
      );
    } finally {
      setState(() {
        _isAnalyzing = false;
      });
    }
  }

  Future<void> _checkVirusTotal() async {
    if (_analysisResult == null) return;
    
    setState(() => _isAnalyzing = true);
    try {
        final fileId = _analysisResult!['file_id'];
        var response = await http.post(Uri.parse('$_backendUrl/sandbox/$fileId'));
        
        if (response.statusCode == 200) {
            final vtResult = jsonDecode(response.body);
            if (!mounted) return;
            showDialog(
              context: context, 
              builder: (_) => AlertDialog(
                backgroundColor: Colors.black87,
                title: Text("VIRUSTOTAL SANDBOX REPORT", style: GoogleFonts.rajdhani(color: Colors.cyanAccent, fontWeight: FontWeight.bold)),
                content: SizedBox(
                  width: double.maxFinite,
                  child: SingleChildScrollView(
                    child: Text(
                      const JsonEncoder.withIndent('  ').convert(vtResult),
                      style: GoogleFonts.robotoMono(color: Colors.white70, fontSize: 12),
                    ),
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context), 
                    child: Text("CLOSE", style: TextStyle(color: Theme.of(context).primaryColor))
                  )
                ]
              )
            );
        } else {
             if (!mounted) return;
             ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('VT Error: ${response.body}')));
        }
    } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error connecting to backend: $e')));
    } finally {
        if (mounted) {
          setState(() => _isAnalyzing = false);
        }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('DIVYA DRISHTI // CLASSIFIED VIEWER', 
          style: GoogleFonts.rajdhani(
            fontSize: 24, 
            fontWeight: FontWeight.bold, 
            letterSpacing: 3,
            color: Theme.of(context).colorScheme.primary
          )
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 20),
            decoration: BoxDecoration(
              border: Border.all(color: Theme.of(context).colorScheme.primary.withOpacity(0.5)),
            ),
            child: IconButton(
              icon: const Icon(Icons.file_upload_outlined),
              tooltip: "UPLOAD EVIDENCE",
              color: Theme.of(context).colorScheme.primary,
              onPressed: _pickFile,
            ),
          ),
          if (_analysisResult != null)
            Container(
              margin: const EdgeInsets.only(right: 20),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.redAccent.withOpacity(0.8)),
                color: Colors.redAccent.withOpacity(0.1),
              ),
              child: IconButton(
                icon: const Icon(Icons.shield_outlined),
                tooltip: "VIRUSTOTAL SANDBOX ANALYSIS",
                color: Colors.redAccent,
                onPressed: _checkVirusTotal,
              ),
            ),
        ],
      ),
      body: Stack(
        children: [
          // Grid Background
          Positioned.fill(
            child: CustomPaint(painter: GridPainter(color: Colors.white.withOpacity(0.03))),
          ),
          
          Row(
            children: [
              // Left: Evidence View
              Expanded(
                flex: 5,
                child: Container(
                  margin: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white10),
                    color: Colors.black54,
                  ),
                  child: Center(
                    child: _selectedFile == null 
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                             Icon(Icons.fingerprint, size: 80, color: Theme.of(context).primaryColor.withOpacity(0.5))
                                 .animate(onPlay: (controller) => controller.repeat(reverse: true))
                                 .scale(duration: 2.seconds, begin: const Offset(1,1), end: const Offset(1.1, 1.1))
                                 .then().shimmer(duration: 1.seconds),
                             const SizedBox(height: 20),
                             Text("AWAITING EVIDENCE INPUT", 
                               style: TextStyle(letterSpacing: 2, color: Theme.of(context).primaryColor)
                             ),
                          ],
                        )
                      : _buildPreview(),
                  ),
                ),
              ),
              // Right: Hex View
              Expanded(
                flex: 4,
                child: Container(
                  margin: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    border: Border(left: BorderSide(color: Theme.of(context).primaryColor.withOpacity(0.3))),
                    color: Colors.black87,
                  ),
                  child: _analysisResult == null 
                    ? Center(
                        child: Text("HEX STREAM OFFLINE", style: TextStyle(color: Colors.white24, letterSpacing: 2)),
                      )
                    : Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            color: Theme.of(context).primaryColor.withOpacity(0.1),
                            width: double.infinity,
                            child: const Text("RAW BYTE STREAM", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                          ),
                          Expanded(
                            child: HexViewer(
                              fileId: _analysisResult!['file_id'], 
                              backendUrl: _backendUrl
                            ),
                          ),
                        ],
                      ),
                ),
              ),
            ],
          ),
          
          if (_isAnalyzing)
            Container(
              color: Colors.black87,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                     const Icon(Icons.radar, size: 100, color: Colors.cyanAccent)
                       .animate(onPlay: (c) => c.repeat()).rotate(duration: 2.seconds),
                     const SizedBox(height: 20),
                     Text("ANALYZING ARTIFACT...", style: GoogleFonts.rajdhani(fontSize: 24, letterSpacing: 5)),
                  ],
                ),
              ),
            ),
            
          if (_showThirdEyeRequest && !_isAnalyzing)
            Positioned(
              bottom: 40,
              right: 40,
              child: FloatingActionButton.extended(
                onPressed: () {
                   showDialog(
                     context: context,
                     builder: (_) => ThirdEyeOverlay(data: _analysisResult!)
                   );
                },
                label: Text("ACTIVATE DIVYA DRISHTI", style: GoogleFonts.rajdhani(fontWeight: FontWeight.bold, letterSpacing: 1)),
                icon: const Icon(Icons.visibility),
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.black,
              ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack).shimmer(delay: 1.seconds, duration: 2.seconds),
            ),
        ],
      ),
    );
  }

  Widget _buildPreview() {
    final ext = _selectedFile!.extension?.toLowerCase() ?? "";
    Widget content;
    
    // Check for faces
    final vision = _analysisResult?['vision'];
    final faces = vision != null ? (vision['boxes'] as List?) : null;
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext) && _selectedFile!.bytes != null) {
      // If faces detected, overlay boxes
      if (faces != null && faces.isNotEmpty) {
         content = LayoutBuilder(
           builder: (context, constraints) {
             // We can't easily map exact coordinates without knowing the image render size vs natural size.
             // For this prototype, we will just show the scan effect.
             // A real implementation would use FittedBox logic or custom painter with image size ratio.
             return Stack(
               children: [
                 Image.memory(_selectedFile!.bytes!),
                 Positioned.fill(
                   child: CustomPaint(
                     painter: FaceBoxPainter(faces: faces), // Simulating scanning
                   ),
                 )
               ],
             );
           }
         );
      } else {
         content = Image.memory(_selectedFile!.bytes!);
      }
    } else {
      content = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.insert_drive_file, size: 64, color: Theme.of(context).colorScheme.secondary),
          const SizedBox(height: 10),
          Text(_selectedFile!.name, style: const TextStyle(color: Colors.white)),
        ],
      );
    }
    
    // Add Secure Sandbox Banner & Scan Effect
    return Stack(
      alignment: Alignment.center,
      children: [
        content,
        // Secure Banner
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Container(
            color: Colors.redAccent.withOpacity(0.8),
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock, size: 14, color: Colors.white),
                const SizedBox(width: 8),
                Text("SECURE SANDBOX // READ-ONLY // MODIFICATION DISABLED", 
                  style: GoogleFonts.robotoMono(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)
                ),
              ],
            ),
          ).animate().slideY(begin: -1, end: 0),
        ),
        
        Positioned.fill(
           child: IgnorePointer(
             child: Container(
               decoration: BoxDecoration(
                 border: Border.all(color: Theme.of(context).primaryColor.withOpacity(0.3), width: 1),
               ),
               child: _isAnalyzing 
                  ? Container() 
                  : Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Colors.transparent], 
                        ),
                      ),
                    ),
             ),
           ),
        )
      ],
    ).animate().fadeIn(duration: 500.ms);
  }
}

class FaceBoxPainter extends CustomPainter {
  final List faces;
  FaceBoxPainter({required this.faces});
  
  @override
  void paint(Canvas canvas, Size size) {
    // Mocking face detection boxes for visual effect since scaling is complex in snippet
    // In a real app we'd calculate ratio: displayedSize / actualImageSize
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class GridPainter extends CustomPainter {
  final Color color;
  GridPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color..strokeWidth = 1;
    const step = 40.0;
    for (double i = 0; i < size.width; i += step) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
    for (double i = 0; i < size.height; i += step) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

