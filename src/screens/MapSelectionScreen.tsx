import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useSettings } from "../context/SettingsContext";
import { darkMapStyle } from "../utils/mapStyles";
import { IconButton, Searchbar } from "react-native-paper";
import { GOOGLE_MAPS_API_KEY } from "../config/config";
import { AudioNode, UserLocation, MapSelectionScreenProps } from "../types";

export const MapSelectionScreen: React.FC<MapSelectionScreenProps> = ({
    userLocation,
    audioNodes,
    activeRoute,
    onAddToRoute,
    onStartNavigation,
    onCancel,
    onOpenSettings,
}) => {
    const { mapStyle } = useSettings();
    const [temporaryPin, setTemporaryPin] = useState<AudioNode | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const mapRef = useRef<MapView>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                "https://places.googleapis.com/v1/places:searchText",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                        "X-Goog-FieldMask":
                            "places.displayName,places.location,places.formattedAddress,places.id",
                    },
                    body: JSON.stringify({
                        textQuery: searchQuery,
                    }),
                },
            );

            const data = await response.json();

            if (data.places && data.places.length > 0) {
                const place = data.places[0];
                const { latitude, longitude } = place.location;

                mapRef.current?.animateToRegion(
                    {
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    },
                    1000,
                );

                setTemporaryPin({
                    id: `search-${place.id}`,
                    title: place.displayName.text,
                    latitude,
                    longitude,
                    audioUrl: "",
                });
            } else {
                console.warn("No places found");
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleMapLongPress = (e: any) => {
        // ...
        const { coordinate } = e.nativeEvent;
        const newPin: AudioNode = {
            id: `temp-${Date.now()}`,
            title: "New Point",
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            audioUrl: "",
        };
        setTemporaryPin(newPin);
        onAddToRoute(newPin);
    };

    const handleAddToRoute = (node: AudioNode) => {
        onAddToRoute(node);
        setTemporaryPin(null);
    };

    return (
        <View style={styles.container}>
            <StatusBar />

            <View style={styles.searchContainer}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <Searchbar
                        placeholder="Search for a place"
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        onSubmitEditing={handleSearch}
                        loading={isSearching}
                        style={{
                            flex: 1,
                            backgroundColor:
                                mapStyle === "dark" ? "#333" : "#fff",
                            marginRight: 10,
                        }}
                        inputStyle={{
                            color: mapStyle === "dark" ? "#fff" : "#000",
                        }}
                        iconColor={mapStyle === "dark" ? "#fff" : "#000"}
                        placeholderTextColor={
                            mapStyle === "dark" ? "#aaa" : "#555"
                        }
                    />
                    <IconButton
                        icon="cog"
                        mode="contained"
                        containerColor={mapStyle === "dark" ? "#333" : "#fff"}
                        iconColor={mapStyle === "dark" ? "#fff" : "#000"}
                        size={24}
                        onPress={onOpenSettings}
                    />
                </View>
            </View>

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                googleMapId="964e1bd62e482dd5406f49cc"
                customMapStyle={mapStyle === "dark" ? darkMapStyle : []}
                showsUserLocation
                showsMyLocationButton
                onLongPress={handleMapLongPress}
            >
                {audioNodes.map((node) => (
                    <Marker
                        key={node.id}
                        coordinate={{
                            latitude: node.latitude,
                            longitude: node.longitude,
                        }}
                        title={node.title}
                        pinColor="teal"
                    >
                        <Callout onPress={() => handleAddToRoute(node)}>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>
                                    {node.title}
                                </Text>
                                <Text style={styles.calloutBtn}>
                                    + Add to Route
                                </Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* Active Route Markers */}
                {activeRoute.map((node, index) => (
                    <Marker
                        key={`route-${node.id}-${index}`}
                        coordinate={{
                            latitude: node.latitude,
                            longitude: node.longitude,
                        }}
                        title={`${index + 1}. ${node.title}`}
                        pinColor="green"
                    />
                ))}

                {temporaryPin && (
                    <Marker
                        coordinate={{
                            latitude: temporaryPin.latitude,
                            longitude: temporaryPin.longitude,
                        }}
                        title={temporaryPin.title}
                        pinColor="orange"
                    >
                        <Callout onPress={() => handleAddToRoute(temporaryPin)}>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>
                                    {temporaryPin.title}
                                </Text>
                                <Text style={styles.calloutBtn}>
                                    + Add to Route
                                </Text>
                            </View>
                        </Callout>
                    </Marker>
                )}

                {activeRoute.length > 0 && (
                    <MapViewDirections
                        origin={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        destination={{
                            latitude:
                                activeRoute[activeRoute.length - 1].latitude,
                            longitude:
                                activeRoute[activeRoute.length - 1].longitude,
                        }}
                        waypoints={activeRoute.slice(0, -1).map((n) => ({
                            latitude: n.latitude,
                            longitude: n.longitude,
                        }))}
                        apikey={GOOGLE_MAPS_API_KEY}
                        strokeWidth={3}
                        strokeColor="#4CAF50"
                        mode="WALKING"
                    />
                )}
            </MapView>

            <View
                style={[
                    styles.selectionPanel,
                    { backgroundColor: mapStyle === "dark" ? "#222" : "#fff" },
                ]}
            >
                <Text
                    style={[
                        styles.panelTitle,
                        { color: mapStyle === "dark" ? "#fff" : "#000" },
                    ]}
                >
                    Current Route ({activeRoute.length})
                </Text>
                <ScrollView style={styles.routeList} horizontal>
                    {activeRoute.map((node, i) => (
                        <View
                            key={i}
                            style={[
                                styles.routeItem,
                                {
                                    backgroundColor:
                                        mapStyle === "dark" ? "#444" : "#eee",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.routeItemText,
                                    {
                                        color:
                                            mapStyle === "dark"
                                                ? "#fff"
                                                : "#000",
                                    },
                                ]}
                            >
                                {i + 1}. {node.title}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.selectionButtons}>
                    <TouchableOpacity
                        style={styles.cancelLink}
                        onPress={onCancel}
                    >
                        <Text style={styles.cancelLinkText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.goButton,
                            activeRoute.length === 0 && styles.disabledBtn,
                        ]}
                        onPress={onStartNavigation}
                        disabled={activeRoute.length === 0}
                    >
                        <Text style={styles.goButtonText}>GO ▶</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    map: { flex: 1 },
    searchContainer: {
        position: "absolute",
        top: 50,
        left: 20,
        right: 20,
        zIndex: 100,
        backgroundColor: "transparent",
    },
    selectionPanel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        elevation: 10,
    },
    panelTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
    routeList: { maxHeight: 50, marginBottom: 15 },
    routeItem: {
        backgroundColor: "#eee",
        padding: 8,
        borderRadius: 10,
        marginRight: 10,
        justifyContent: "center",
    },
    routeItemText: { fontSize: 14 },
    selectionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cancelLink: { padding: 10 },
    cancelLinkText: { color: "#f44336" },
    goButton: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    disabledBtn: { backgroundColor: "#ccc" },
    goButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    callout: { padding: 5, alignItems: "center" },
    calloutTitle: { fontWeight: "bold", marginBottom: 5 },
    calloutBtn: { color: "#007AFF" },
});
