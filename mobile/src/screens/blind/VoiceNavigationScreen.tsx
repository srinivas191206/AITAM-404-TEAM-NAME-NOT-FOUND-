import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocationContext } from '../../context/LocationContext';
import { navigationService, PlaceSearchResult } from '../../services/navigationService';
import { NavigationRoute } from '../../types';
import { outputService } from '../../services/outputService';
import { AccessibleButton } from '../../components/AccessibleButton';
import { Colors } from '../../theme/colors';

interface VoiceNavigationScreenProps {
  onBack: () => void;
  onOpenObstacleCamera: () => void;
}

export const VoiceNavigationScreen: React.FC<VoiceNavigationScreenProps> = ({
  onBack,
  onOpenObstacleCamera,
}) => {
  const { currentLocation } = useLocationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    outputService.announce(`Searching for ${queryToSearch}...`);

    const userCoord = currentLocation
      ? { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude }
      : undefined;

    const results = await navigationService.searchPlace(queryToSearch, userCoord);
    setSearchResults(results);
    setIsSearching(false);

    if (results.length > 0) {
      outputService.announce(`Found ${results.length} locations. Tap a result to start route.`);
    } else {
      outputService.announce(`No locations found for ${queryToSearch}.`);
    }
  };

  const handleSelectDestination = async (place: PlaceSearchResult) => {
    const startCoord = currentLocation
      ? { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude }
      : { latitude: 12.9716, longitude: 77.5946 };

    setIsSearching(true);
    outputService.announce(`Calculating walking route to ${place.name}...`);

    const route = await navigationService.getWalkingRoute(startCoord, {
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
    });

    setIsSearching(false);

    if (route) {
      setActiveRoute(route);
      setCurrentStepIndex(0);
      const firstStep = route.steps[0]?.instruction || 'Start walking towards destination.';
      outputService.announce(
        `Route ready to ${route.destinationName}. Total distance ${route.totalDistanceMeters} meters. First step: ${firstStep}`,
        'urgent'
      );
      outputService.triggerHaptic('info');
    }
  };

  const handleNextStep = () => {
    if (activeRoute && currentStepIndex < activeRoute.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const step = activeRoute.steps[nextIdx];
      outputService.announce(step.instruction, 'urgent');
      outputService.triggerHaptic('warning');
    } else if (activeRoute) {
      outputService.announce(`You have arrived at ${activeRoute.destinationName}!`, 'urgent');
      outputService.triggerHaptic('info');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Back to Dashboard"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧭 Voice Navigation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ACTIVE ROUTE GUIDANCE HUD */}
        {activeRoute ? (
          <View style={styles.activeRouteContainer}>
            <View style={styles.destinationCard}>
              <Text style={styles.destLabel}>NAVIGATING TO</Text>
              <Text style={styles.destName}>{activeRoute.destinationName}</Text>
              <Text style={styles.destMeta}>
                Distance: {activeRoute.totalDistanceMeters}m • Step {currentStepIndex + 1} of {activeRoute.steps.length}
              </Text>
            </View>

            {/* CURRENT STEP BOX */}
            <View style={styles.currentStepCard}>
              <Text style={styles.stepBadge}>CURRENT INSTRUCTION</Text>
              <Text style={styles.stepInstruction}>
                {activeRoute.steps[currentStepIndex]?.instruction || 'Proceed along path.'}
              </Text>
              <Text style={styles.stepDistance}>
                Remaining: {activeRoute.steps[currentStepIndex]?.distanceMeters} meters
              </Text>
            </View>

            <View style={styles.navActionButtons}>
              <AccessibleButton
                title="🔊 Repeat Instruction"
                size="normal"
                variant="secondary"
                onPress={() => outputService.announce(activeRoute.steps[currentStepIndex]?.instruction || '', 'high')}
              />

              <AccessibleButton
                title="➡️ Next Step"
                size="large"
                variant="primary"
                onPress={handleNextStep}
              />

              <AccessibleButton
                title="📷 Check Path Obstacles"
                size="normal"
                variant="secondary"
                onPress={onOpenObstacleCamera}
              />

              <AccessibleButton
                title="❌ End Navigation"
                size="normal"
                variant="danger"
                onPress={() => {
                  setActiveRoute(null);
                  outputService.announce('Navigation ended.');
                }}
              />
            </View>
          </View>
        ) : (
          /* PLACE SEARCH & PRESETS */
          <View>
            <Text style={styles.sectionLabel}>ENTER DESTINATION</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="e.g. Hospital, Pharmacy, Station"
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => handleSearch(searchQuery)}
                accessible={true}
                accessibilityLabel="Destination search text field"
              />
              <TouchableOpacity
                onPress={() => handleSearch(searchQuery)}
                style={styles.searchButton}
                accessible={true}
                accessibilityLabel="Search"
              >
                <Text style={styles.searchButtonText}>SEARCH</Text>
              </TouchableOpacity>
            </View>

            {isSearching && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.blindPrimary} />
                <Text style={styles.loadingText}>Fetching route & places...</Text>
              </View>
            )}

            {/* PRESET QUICK DESTINATIONS */}
            <Text style={styles.sectionLabel}>QUICK DESTINATIONS</Text>
            <View style={styles.quickGrid}>
              <AccessibleButton
                title="🏥 Nearest Hospital"
                variant="secondary"
                size="normal"
                onPress={() => handleSearch('Hospital')}
              />
              <AccessibleButton
                title="💊 Nearest Pharmacy"
                variant="secondary"
                size="normal"
                onPress={() => handleSearch('Pharmacy')}
              />
              <AccessibleButton
                title="🚉 Railway Station"
                variant="secondary"
                size="normal"
                onPress={() => handleSearch('Railway Station')}
              />
              <AccessibleButton
                title="🏠 Safe Zone / Home"
                variant="primary"
                size="normal"
                onPress={() => handleSearch('Home')}
              />
            </View>

            {/* SEARCH RESULTS LIST */}
            {searchResults.length > 0 && (
              <View style={styles.resultsList}>
                <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
                {searchResults.map((place, idx) => (
                  <TouchableOpacity
                    key={idx}
                    accessible={true}
                    accessibilityLabel={`Route to ${place.name}`}
                    style={styles.resultItem}
                    onPress={() => handleSelectDestination(place)}
                  >
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultAddress} numberOfLines={2}>
                      {place.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceInteractive,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  backButtonText: {
    color: Colors.blindPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.blindPrimary,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textHighEmphasis,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  searchButton: {
    backgroundColor: Colors.blindPrimary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  searchButtonText: {
    color: '#121110',
    fontWeight: '800',
    fontSize: 14,
  },
  loadingBox: {
    marginVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMediumEmphasis,
    marginTop: 8,
    fontSize: 15,
  },
  quickGrid: {
    gap: 6,
  },
  resultsList: {
    marginTop: 16,
  },
  resultItem: {
    backgroundColor: Colors.surfaceElevated,
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.blindPrimary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  resultName: {
    color: Colors.textHighEmphasis,
    fontSize: 17,
    fontWeight: '700',
  },
  resultAddress: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  activeRouteContainer: {
    gap: 12,
  },
  destinationCard: {
    backgroundColor: Colors.surfaceElevated,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.blindBorder,
  },
  destLabel: {
    color: Colors.blindPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  destName: {
    color: Colors.textHighEmphasis,
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  destMeta: {
    color: Colors.textMediumEmphasis,
    fontSize: 14,
    fontWeight: '600',
  },
  currentStepCard: {
    backgroundColor: Colors.surfaceInteractive,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
  },
  stepBadge: {
    color: Colors.blindPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepInstruction: {
    color: Colors.textHighEmphasis,
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 8,
    lineHeight: 28,
  },
  stepDistance: {
    color: Colors.textMediumEmphasis,
    fontSize: 15,
    fontWeight: '600',
  },
  navActionButtons: {
    gap: 8,
    marginTop: 8,
  },
});
