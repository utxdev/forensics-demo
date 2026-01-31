import 'package:flutter/material.dart';
import '../core/constants.dart';

class SudarshanaScreen extends StatelessWidget {
  const SudarshanaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.vedicGold.withOpacity(0.3), width: 2),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Placeholder for Rive Animation (Spinning Chakra)
            const SizedBox(
              width: 200,
              height: 200,
              child: CircularProgressIndicator(
                color: AppColors.agniOrange,
                strokeWidth: 8,
              ),
            ),
            const SizedBox(height: 32),
            Text("SUDARSHANA SCANNING", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text("0 THREATS DETECTED", style: TextStyle(color: AppColors.dharmaGreen, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
