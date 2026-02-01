package com.antigravity.gandiva

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.antigravity.gandiva.ui.MainViewModel
import com.antigravity.gandiva.ui.screens.HomeScreen
import com.antigravity.gandiva.ui.theme.GandivaTheme
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState

class MainActivity : ComponentActivity() {
    
    private val viewModel: MainViewModel by viewModels()

    @OptIn(ExperimentalPermissionsApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            GandivaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize()
                ) {
                    val permissions = mutableListOf(
                        Manifest.permission.READ_SMS,
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    )
                    
                    if (Build.VERSION.SDK_INT >= 33) {
                       permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
                       permissions.add(Manifest.permission.READ_MEDIA_VIDEO)
                    } else {
                       permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
                    }
                
                    val permissionState = rememberMultiplePermissionsState(permissions = permissions)

                    HomeScreen(
                        viewModel = viewModel,
                        permissionState = permissionState
                    )
                }
            }
        }
    }
}
