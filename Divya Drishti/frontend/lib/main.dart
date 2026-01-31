import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/viewer_screen.dart';

void main() {
  runApp(const DivyaDrishtiApp());
}

class DivyaDrishtiApp extends StatelessWidget {
  const DivyaDrishtiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Divya Drishti',
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0E17), // Deep Dark Blue/Black
        primaryColor: const Color(0xFF00F0FF), // Cyberpunk Cyan
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00F0FF),
          secondary: Color(0xFFD300C5), // Cyberpunk Pink
          surface: Color(0xFF141A28),
          background: Color(0xFF0A0E17),
        ),
        textTheme: GoogleFonts.rajdhaniTextTheme(
          Theme.of(context).textTheme.apply(bodyColor: Colors.white, displayColor: Colors.white),
        ),
        useMaterial3: true,
      ),
      home: const ViewerScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
