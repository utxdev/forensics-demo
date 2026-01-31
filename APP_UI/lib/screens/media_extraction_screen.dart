import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';

class MediaExtractionScreen extends StatefulWidget {
  const MediaExtractionScreen({super.key});

  @override
  State<MediaExtractionScreen> createState() => _MediaExtractionScreenState();
}

class _MediaExtractionScreenState extends State<MediaExtractionScreen> {
  static const platform = MethodChannel('com.example.call_logs/logs');

  // Mime Types
  final Map<String, String> _categories = {
    'Audio': 'audio/%',
    'Images': 'image/%',
    'Videos': 'video/%',
    'APK': 'application/vnd.android.package-archive',
    'Archives':
        'application/zip', // Simplification, might need OR logic in native for multiple archive types
    'Documents': 'application/pdf', // Simplification
    'Suspicious': 'SUSPICIOUS',
  };

  String? _selectedCategory;
  List<String> _files = [];
  bool _isLoading = false;
  String _errorMessage = '';

  Future<void> _getFiles(String category) async {
    setState(() {
      _selectedCategory = category;
      _isLoading = true;
      _errorMessage = '';
      _files = [];
    });

    final mimeType = _categories[category];
    if (mimeType == null) return;

    try {
      bool hasPermission = false;

      // Check for Manage External Storage (Android 11+)
      if (await Permission.manageExternalStorage.isGranted) {
        hasPermission = true;
      } else if (await Permission.storage.isGranted) {
        hasPermission = true;
      } else {
        // Request Permissions
        // First try standard storage
        if (await Permission.storage.request().isGranted) {
          hasPermission = true;
        } else {
          // If denied or on Android 11+ where storage might be scoped
          // Request Manage External Storage
          if (await Permission.manageExternalStorage.request().isGranted) {
            hasPermission = true;
          }
        }
      }

      if (hasPermission) {
        final List<dynamic> result = await platform.invokeMethod('getFiles', {
          'mimeType': mimeType,
        });
        setState(() {
          _files = result.cast<String>();
        });
      } else {
        setState(() {
          _errorMessage = "Permission denied. Please grant Storage access.";
        });
        // Optionally open settings if permanently denied
        if (await Permission.manageExternalStorage.isPermanentlyDenied ||
            await Permission.storage.isPermanentlyDenied) {
          openAppSettings();
        }
      }
    } on PlatformException catch (e) {
      setState(() {
        _errorMessage = "Failed to get files: '${e.message}'.";
      });
    } catch (e) {
      setState(() {
        _errorMessage = "An unexpected error occurred: $e";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _shareFile(String path) async {
    await Share.shareXFiles([XFile(path)]);
  }

  Widget _buildCategoryGrid() {
    return GridView.count(
      crossAxisCount: 2,
      padding: const EdgeInsets.all(16),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      children: _categories.keys.map((category) {
        IconData icon;
        Color color;
        switch (category) {
          case 'Audio':
            icon = Icons.audiotrack;
            color = Colors.purple;
            break;
          case 'Images':
            icon = Icons.image;
            color = Colors.green;
            break;
          case 'Videos':
            icon = Icons.videocam;
            color = Colors.red;
            break;
          case 'APK':
            icon = Icons.android;
            color = Colors.teal;
            break;
          case 'Archives':
            icon = Icons.folder_zip;
            color = Colors.orange;
            break;
          case 'Suspicious':
            icon = Icons.security;
            color = Colors.redAccent;
            break;
          default:
            icon = Icons.insert_drive_file;
            color = Colors.blue;
        }

        return Card(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: InkWell(
            onTap: () => _getFiles(category),
            borderRadius: BorderRadius.circular(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 48, color: color),
                const SizedBox(height: 8),
                Text(
                  category,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFileList() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final headerColor = isDark ? Colors.grey[800] : Colors.grey[200];
    final textColor = isDark ? Colors.white : Colors.black87;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: headerColor,
          width: double.infinity,
          child: Row(
            children: [
              IconButton(
                icon: Icon(Icons.arrow_back, color: textColor),
                onPressed: () {
                  setState(() {
                    _selectedCategory = null;
                    _files = [];
                  });
                },
              ),
              Text(
                " $_selectedCategory Files",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              const Spacer(),
              Text(
                "${_files.length} found",
                style: TextStyle(color: textColor),
              ),
            ],
          ),
        ),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _errorMessage.isNotEmpty
              ? Center(child: Text(_errorMessage))
              : _files.isEmpty
              ? const Center(child: Text("No files found in this category."))
              : ListView.separated(
                  itemCount: _files.length,
                  separatorBuilder: (ctx, i) => const Divider(),
                  itemBuilder: (context, index) {
                    final path = _files[index];
                    final name = path.split('/').last;
                    return ListTile(
                      leading: const Icon(Icons.insert_drive_file),
                      title: Text(name),
                      subtitle: Text(path),
                      trailing: IconButton(
                        icon: const Icon(Icons.share),
                        onPressed: () => _shareFile(path),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Media Extraction")),
      body: Column(
        children: [
          if (_selectedCategory == null)
            Container(
              padding: const EdgeInsets.all(12),
              color: Colors.amber[100],
              width: double.infinity,
              child: Row(
                children: const [
                  Icon(Icons.info, color: Colors.amber),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "Notice: To retrieve ALL files including system hidden files, please use our desktop application.",
                      style: TextStyle(color: Colors.black87),
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: _selectedCategory == null
                ? _buildCategoryGrid()
                : _buildFileList(),
          ),
        ],
      ),
    );
  }
}
