package com.antigravity.gandiva.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.antigravity.gandiva.data.AppListManager
import com.antigravity.gandiva.data.LocationManager
import com.antigravity.gandiva.data.MediaManager
import com.antigravity.gandiva.data.SmsManager
import com.antigravity.gandiva.domain.model.LocationPoint
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class UiState(
    val isExtracting: Boolean = false,
    val smsCount: Int = 0,
    val appCount: Int = 0,
    val mediaCount: Int = 0,
    val locationCount: Int = 0,
    val lastItemExtracted: String = "",
    val currentLocation: LocationPoint? = null
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val smsManager = SmsManager(application)
    private val appManager = AppListManager(application)
    private val mediaManager = MediaManager(application)
    private val locationManager = LocationManager(application)

    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    fun startExtraction() {
        if (_uiState.value.isExtracting) return

        _uiState.value = _uiState.value.copy(
            isExtracting = true,
            smsCount = 0,
            appCount = 0,
            mediaCount = 0,
            locationCount = 0,
            lastItemExtracted = "Initializing..."
        )

        viewModelScope.launch {
            // 1. Start Location Stream
            launch {
                locationManager.getLocationUpdates().collect { location ->
                    _uiState.value = _uiState.value.copy(
                        currentLocation = location,
                        locationCount = _uiState.value.locationCount + 1,
                        lastItemExtracted = "Location Found: ${location.latitude}, ${location.longitude}"
                    )
                }
            }

            // 2. Extract Apps
            launch {
                val apps = appManager.getInstalledApps()
                _uiState.value = _uiState.value.copy(
                    appCount = apps.size,
                    lastItemExtracted = "Apps Indexed: ${apps.size}"
                )
                // In a real app we would stream these or save them one by one
            }

            // 3. Extract SMS
            launch {
                val sms = smsManager.getAllMessages()
                _uiState.value = _uiState.value.copy(
                    smsCount = sms.size,
                    lastItemExtracted = "Messages Secured: ${sms.size}"
                )
            }

            // 4. Extract Media
            launch {
                val media = mediaManager.getAllMedia()
                // Count how many have location
                val geotagged = media.count { it.latitude != null }
                
                _uiState.value = _uiState.value.copy(
                    mediaCount = media.size,
                    locationCount = _uiState.value.locationCount + geotagged, // Add historical points
                    lastItemExtracted = "Media Scanned: ${media.size} ($geotagged with Location)"
                )
            }
        }
    }
}
