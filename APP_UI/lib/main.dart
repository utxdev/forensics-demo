import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: TrinetraApp()));
}

class TrinetraApp extends StatelessWidget {
  const TrinetraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Trinetra Forensics',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkGodTier,
      home: const CinematicSplashScreen(),
    );
  }
}
