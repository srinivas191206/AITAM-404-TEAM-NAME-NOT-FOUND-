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
import { Spacing } from '../../theme/spacing';

interface VoiceNavigationScreenProps {
  onBack?: () => void;
  onOpenObstacleCamera?: () => void;
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

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: palette.accentTeal }]}>← BACK</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle, { color: palette.primaryText }]}>🧭 Voice Navigation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ACTIVE ROUTE GUIDANCE HUD */}
        {activeRoute ? (
          <View style={styles.activeRouteContainer}>
            <View style={[styles.destinationCard, { backgroundColor: palette.card, borderColor: palette.accentTeal }]}>
              <Text style={[styles.destLabel, { color: palette.accentTeal }]}>NAVIGATING TO</Text>
              <Text style={[styles.destName, { color: palette.primaryText }]}>{activeRoute.destinationName}</Text>
              <Text style={[styles.destMeta, { color: palette.secondaryText }]}>
                Distance: {activeRoute.totalDistanceMeters}m • Step {currentStepIndex + 1} of {activeRoute.steps.length}
              </Text>
            </View>

            {/* CURRENT STEP BOX */}
            <View style={[styles.currentStepCard, { backgroundColor: '#F4FBFB', borderColor: palette.accentTeal }]}>
              <Text style={[styles.stepBadge, { color: palette.accentTeal }]}>CURRENT INSTRUCTION</Text>
              <Text style={[styles.stepInstruction, { color: palette.primaryText }]}>
                {activeRoute.steps[currentStepIndex]?.instruction || 'Proceed along path.'}
              </Text>
              <Text style={[styles.stepDistance, { color: palette.secondaryText }]}>
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
                variant="teal"
                onPress={handleNextStep}
              />

              {onOpenObstacleCamera ? (
                <AccessibleButton
                  title="📷 Check Path Obstacles"
                  size="normal"
                  variant="secondary"
                  onPress={onOpenObstacleCamera}
                />
              ) : null}

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
            <Text style={[styles.sectionLabel, { color: palette.accentTeal }]}>ENTER DESTINATION</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: palette.card, color: palette.primaryText, borderColor: palette.border }]}
                placeholder="e.g. Hospital, Pharmacy, Station"
                placeholderTextColor={palette.secondaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => handleSearch(searchQuery)}
                accessible={true}
                accessibilityLabel="Destination search text field"
              />
              <TouchableOpacity
                onPress={() => handleSearch(searchQuery)}
                style={[styles.searchButton, { backgroundColor: palette.accentTeal }]}
                accessible={true}
                accessibilityLabel="Search"
              >
                <Text style={styles.searchButtonText}>SEARCH</Text>
              </TouchableOpacity>
            </View>

            {isSearching && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={palette.accentTeal} />
                <Text style={[styles.loadingText, { color: palette.secondaryText }]}>Fetching route & places...</Text>
              </View>
            )}

            {/* PRESET QUICK DESTINATIONS */}
            <Text style={[styles.sectionLabel, { color: palette.accentTeal }]}>QUICK DESTINATIONS</Text>
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
                variant="teal"
                size="normal"
                onPress={() => handleSearch('Home')}
              />
            </View>

            {/* SEARCH RESULTS LIST */}
            {searchResults.length > 0 && (
              <View style={styles.resultsList}>
                <Text style={[styles.sectionLabel, { color: palette.accentTeal }]}>SEARCH RESULTS</Text>
                {searchResults.map((place, idx) => (
                  <TouchableOpacity
                    key={idx}
                    accessible={true}
                    accessibilityLabel={`Route to ${place.name}`}
                    style={[styles.resultItem, { backgroundColor: palette.card, borderColor: palette.border, borderLeftColor: palette.accentTeal }]}
                    onPress={() => handleSelectDestination(place)}
                  >
                    <Text style={[styles.resultName, { color: palette.primaryText }]}>{place.name}</Text>
                    <Text style={[styles.resultAddress, { color: palette.secondaryText }]} numberOfLines={2}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  searchButton: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  loadingBox: {
    marginVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 6,
    fontSize: 14,
  },
  quickGrid: {
    gap: 8,
  },
  resultsList: {
    marginTop: 14,
  },
  resultItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '800',
  },
  resultAddress: {
    fontSize: 13,
    marginTop: 4,
  },
  activeRouteContainer: {
    gap: 12,
  },
  destinationCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  destLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  destName: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  destMeta: {
    fontSize: 14,
    fontWeight: '500',
  },
  currentStepCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  stepBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stepInstruction: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 6,
    lineHeight: 26,
  },
  stepDistance: {
    fontSize: 14,
    fontWeight: '500',
  },
  navActionButtons: {
    gap: 8,
    marginTop: 4,
  },
});
