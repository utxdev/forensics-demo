import 'package:flutter/material.dart';
import '../core/constants.dart';

class ChitraguptaScreen extends StatelessWidget {
  const ChitraguptaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("CASE REPORT GENERATION", style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 32),
          
          // Case Summary Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                   _buildRow("Case ID", "CASE-2026-X99"),
                   Divider(color: AppColors.vedicGold.withValues(alpha: 0.5)),
                   _buildRow("Investigator", "Agent Katana"),
                   Divider(color: AppColors.vedicGold.withValues(alpha: 0.5)),
                   _buildRow("Evidence Count", "1,240 Items"),
                   Divider(color: AppColors.vedicGold.withValues(alpha: 0.5)),
                   _buildRow("Malware Detected", "3 Critical Threats", isAlert: true),
                ],
              ),
            ),
          ),
          
          const Spacer(),
          
          Center(
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.verified_user),
              label: const Text("GENERATE KARMA REPORT"),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.royalMaroon,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 24),
                textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isAlert = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(
            value,
            style: TextStyle(
              color: isAlert ? AppColors.asuraRed : AppColors.indraBlue,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
