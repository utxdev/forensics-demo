import 'package:flutter/material.dart';
import '../core/constants.dart';

class KaalChakraScreen extends StatelessWidget {
  const KaalChakraScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Background Time Dial (Visual Only)
        Positioned(
          right: -100,
          top: -100,
          child: Opacity(
            opacity: 0.1,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.royalMaroon, width: 20),
              ),
            ),
          ),
        ),
        
        // Main Timeline Content
        Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "KAAL-CHAKRA TIMELINE",
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  itemCount: 10, // Mock items
                  itemBuilder: (context, index) {
                    return _buildTimeNode(index);
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTimeNode(int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          // Time Column
          Column(
            children: [
              Text(
                "10:${30 + index} AM",
                style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.royalMaroon),
              ),
              Container(height: 40, width: 2, color: AppColors.vedicGold),
            ],
          ),
          const SizedBox(width: 16),
          // Event Card
          Expanded(
            child: Card(
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.vedicGold.withValues(alpha: 0.2),
                  child: Icon(Icons.call, color: AppColors.royalMaroon),
                ),
                title: Text("Incoming Call from +91 98765 43210"),
                subtitle: Text("Duration: 12m 30s • Location: Delhi"),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
