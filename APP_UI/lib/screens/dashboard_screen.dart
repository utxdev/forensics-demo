import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:window_manager/window_manager.dart';
import 'dart:ui'; // For ImageFilter
import 'dart:io';
import '../theme/app_theme.dart';
import 'gandiva_extraction.dart';
import 'sudarshana_analysis.dart';
import 'kaal_chakra_timeline.dart';
import 'divya_drishti_viewer.dart';
import 'chitragupta_report.dart';

// Navigation State Provider
final currentModuleProvider = StateProvider<String>((ref) => 'GANDIVA');

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentModule = ref.watch(currentModuleProvider);

    Widget content;
    switch (currentModule) {
      case 'GANDIVA': content = const GandivaScreen(); break;
      case 'SUDARSHANA': content = const SudarshanaScreen(); break;
      case 'KAAL-CHAKRA': content = const KaalChakraScreen(); break;
      case 'DIVYA-DRISHTI': content = const DivyaDrishtiScreen(); break;
      case 'CHITRAGUPTA': content = const ChitraguptaScreen(); break;
      default: content = const GandivaScreen();
    }

    return Scaffold(
      extendBodyBehindAppBar: true, // Allow body to go behind app bar
      body: Container(
        // 1. GLOBAL BACKGROUND: Cosmic Void Gradient
        decoration: const BoxDecoration(
          gradient: AppColors.cosmicVoidGradient,
        ),
        child: Column(
          children: [
            // Custom Title Bar (Platform Safe)
            _buildTitleBar(),
            
            Expanded(
              child: Row(
                children: [
                  // 2. GLASS SIDEBAR
                  _buildGlassSidebar(ref, currentModule),
                  
                  // 3. MAIN CONTENT AREA (Floating Hologram)
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.neonCyan.withOpacity(0.2)),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.neonCyan.withOpacity(0.1),
                            blurRadius: 30,
                            spreadRadius: -5,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                          child: content,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGlassSidebar(WidgetRef ref, String currentModule) {
    return Container(
      width: 260,
      margin: const EdgeInsets.only(left: 16, top: 16, bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.glassPanel,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Column(
            children: [
              const SizedBox(height: 30),
              // Logo Area
              ShaderMask(
                shaderCallback: (bounds) => AppColors.cyberVedicGradient.createShader(bounds),
                child: const Icon(Icons.remove_red_eye_rounded, size: 60, color: Colors.white),
              ),
              const SizedBox(height: 10),
              Text("TRINETRA", style: AppTheme.darkGodTier.textTheme.displayLarge?.copyWith(fontSize: 24)),
              const SizedBox(height: 40),
              
              // Navigation Items
              _buildNavItem(ref, "GANDIVA", Icons.bolt, currentModule == 'GANDIVA'),
              _buildNavItem(ref, "SUDARSHANA", Icons.radar, currentModule == 'SUDARSHANA'),
              _buildNavItem(ref, "KAAL-CHAKRA", Icons.hourglass_top, currentModule == 'KAAL-CHAKRA'),
              _buildNavItem(ref, "DIVYA-DRISHTI", Icons.visibility, currentModule == 'DIVYA-DRISHTI'),
              _buildNavItem(ref, "CHITRAGUPTA", Icons.description, currentModule == 'CHITRAGUPTA'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(WidgetRef ref, String label, IconData icon, bool isActive) {
    return GestureDetector(
      onTap: () => ref.read(currentModuleProvider.notifier).state = label,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isActive ? AppColors.neonCyan.withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: isActive ? Border.all(color: AppColors.neonCyan.withOpacity(0.5)) : Border.all(color: Colors.transparent),
          boxShadow: isActive ? [
             BoxShadow(color: AppColors.neonCyan.withOpacity(0.2), blurRadius: 15)
          ] : [],
        ),
        child: Row(
          children: [
            Icon(
              icon, 
              color: isActive ? AppColors.neonCyan : Colors.white54,
              shadows: isActive ? [const Shadow(color: AppColors.neonCyan, blurRadius: 10)] : [],
            ),
            const SizedBox(width: 16),
            Text(
              label,
              style: TextStyle(
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                color: isActive ? Colors.white : Colors.white54,
                letterSpacing: 1.2,
                fontFamily: 'Rajdhani',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTitleBar() {
    // Android/iOS SafeArea
    if (Platform.isAndroid || Platform.isIOS) {
       return SafeArea(
         bottom: false,
         child: Container(
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          alignment: Alignment.centerLeft,
          child: Row(
            children: [
               const Text("TRINETRA ///", style: TextStyle(color: AppColors.vedicGold, fontWeight: FontWeight.bold, fontSize: 16)),
               const Spacer(),
               Container(
                 padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                 decoration: BoxDecoration(
                   color: AppColors.crimsonRed.withOpacity(0.2),
                   borderRadius: BorderRadius.circular(20),
                   border: Border.all(color: AppColors.crimsonRed),
                 ),
                 child: const Text("OFFLINE MODE", style: TextStyle(color: AppColors.crimsonRed, fontSize: 10, fontWeight: FontWeight.bold)),
               )
            ],
          ),
         ),
       );
    }

    // Desktop Custom Title Bar
    return DragToMoveArea(
      child: Container(
        height: 40,
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
             const Text("TRINETRA SYSTEM", style: TextStyle(color: Colors.white30, fontSize: 12, letterSpacing: 2)),
             const Spacer(),
             IconButton(icon: const Icon(Icons.minimize, size: 16, color: Colors.white54), onPressed: () => windowManager.minimize()),
             IconButton(icon: const Icon(Icons.close, size: 16, color: Colors.white54), onPressed: () => windowManager.close()),
          ],
        ),
      ),
    );
  }
}
