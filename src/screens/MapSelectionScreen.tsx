import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar,
    FlatList,
    Dimensions,
    Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useSettings } from "../context/SettingsContext";
import { darkMapStyle } from "../utils/mapStyles";
import {
    IconButton,
    Searchbar,
    Modal,
    Portal,
    Button,
    List,
    Dialog,
    TextInput,
    FAB,
    Icon,
} from "react-native-paper";
import { GOOGLE_MAPS_API_KEY } from "../config/config";
import {
    AudioNode,
    UserLocation,
    MapSelectionScreenProps,
    SavedRoute,
} from "../types";
import { useRouteHistory } from "../hooks/useRouteHistory";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
} from "react-native-reanimated";
import { useHaptics } from "../hooks/useHaptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const getDistanceFromLatLonInKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

export const MapSelectionScreen: React.FC<MapSelectionScreenProps> = ({
    userLocation,
    activeRoute,
    onAddToRoute,
    onStartNavigation,
    onCancel,
    onOpenSettings,
    onSetRoute,
    onUpdateRoute,
    onUpdateNode,
}) => {
    const { mapStyle } = useSettings();
    const { history, saveRoute, deleteRoute, isLoading } = useRouteHistory();
    const { selection, impactMedium, notificationSuccess } = useHaptics();

    // State
    const [temporaryPin, setTemporaryPin] = useState<AudioNode | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // History & Editing State
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuAnimation = useSharedValue(0);

    // Renaming
    const [renameDialogVisible, setRenameDialogVisible] = useState(false);
    const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
    const [newName, setNewName] = useState("");

    const mapRef = useRef<MapView>(null);

    const toggleMenu = () => {
        const isOpen = !isMenuOpen;
        setIsMenuOpen(isOpen);
        menuAnimation.value = withSpring(isOpen ? 1 : 0, {
            stiffness: 1000,
        });
        selection();
    };

    const menuIconStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            menuAnimation.value,
            [0, 1],
            [0, 90],
            Extrapolation.CLAMP,
        );
        const opacity = interpolate(
            menuAnimation.value,
            [0, 1],
            [1, 0],
            Extrapolation.CLAMP,
        );
        return {
            transform: [{ rotate: `${rotate}deg` }],
            opacity,
        };
    });

    const closeIconStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            menuAnimation.value,
            [0, 1],
            [-90, 0],
            Extrapolation.CLAMP,
        );
        const opacity = interpolate(
            menuAnimation.value,
            [0, 1],
            [0, 1],
            Extrapolation.CLAMP,
        );
        return {
            transform: [{ rotate: `${rotate}deg` }],
            opacity,
            position: "absolute",
        };
    });

    const menuDropdownStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            menuAnimation.value,
            [0, 1],
            [-20, 0],
            Extrapolation.CLAMP,
        );
        const opacity = interpolate(
            menuAnimation.value,
            [0, 1],
            [0, 1],
            Extrapolation.CLAMP,
        );

        return {
            opacity,
            transform: [{ translateY }],
            // Hide pointer events when closed handled by conditional rendering or pointerEvents prop
        };
    });

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

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
                        maxResultCount: 5, // Limit results
                        locationBias: {
                            circle: {
                                center: {
                                    latitude: userLocation.latitude,
                                    longitude: userLocation.longitude,
                                },
                                radius: 50000, // 50km bias
                            },
                        },
                    }),
                },
            );

            const data = await response.json();

            if (data.places && data.places.length > 0) {
                setSearchResults(data.places);
            } else {
                setSearchResults([]);
                console.warn("No places found");
            }
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (place: any) => {
        selection();
        const { latitude, longitude } = place.location;

        const newPin: AudioNode = {
            id: `search-${place.id}`,
            title: place.displayName.text,
            latitude,
            longitude,
            audioUrl: "",
        };

        // Center map on selection
        mapRef.current?.animateToRegion(
            {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            },
            1000,
        );

        onAddToRoute(newPin);
        setSearchResults([]); // Clear results after selection
        setSearchQuery(""); // Optional: clear search query
    };

    const handleMapLongPress = (e: any) => {
        impactMedium();
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
        notificationSuccess();
        onAddToRoute(node);
        setTemporaryPin(null);
    };

    // --- Deleting Alert Logic ---
    const alrtDelete = (id: string) => {
        Alert.alert(
            "Delete Point",
            "Are you sure you want to delete this point?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => {
                        impactMedium();
                        deleteRoute(id);
                    },
                },
            ],
        );
    };

    // --- Editing Logic ---

    const moveNode = (fromIndex: number, direction: "up" | "down") => {
        if (direction === "up" && fromIndex === 0) return;
        if (direction === "down" && fromIndex === activeRoute.length - 1)
            return;

        const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
        const newRoute = [...activeRoute];
        const [movedNode] = newRoute.splice(fromIndex, 1);
        newRoute.splice(toIndex, 0, movedNode);

        onUpdateRoute(newRoute);
        selection();
    };

    const deleteNode = (index: number) => {
        const newRoute = [...activeRoute];
        newRoute.splice(index, 1);
        onUpdateRoute(newRoute);
        impactMedium();
    };

    const startRenaming = (index: number) => {
        setRenamingIndex(index);
        setNewName(activeRoute[index].title);
        setRenameDialogVisible(true);
    };

    const confirmRename = () => {
        if (renamingIndex !== null) {
            onUpdateNode(renamingIndex, { title: newName });
            selection();
        }
        setRenameDialogVisible(false);
        setRenamingIndex(null);
        setNewName("");
    };

    const handleSaveRoute = async () => {
        await saveRoute(activeRoute);
        notificationSuccess();
        setIsHistoryVisible(true);
    };

    const loadRoute = (route: SavedRoute) => {
        selection();
        onSetRoute(route.nodes);
        setIsHistoryVisible(false);
    };

    // --- Render Helpers ---

    const renderSearchResultItem = ({ item }: { item: any }) => {
        const distance = getDistanceFromLatLonInKm(
            userLocation.latitude,
            userLocation.longitude,
            item.location.latitude,
            item.location.longitude,
        ).toFixed(1);

        const textColor = mapStyle === "dark" ? "#fff" : "#000";
        const subTextColor = mapStyle === "dark" ? "#ccc" : "#666";

        return (
            <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleSelectResult(item)}
            >
                <View style={styles.searchResultLeft}>
                    <View style={styles.pinContainer}>
                        <IconButton
                            icon="map-marker"
                            size={20}
                            iconColor={
                                mapStyle === "dark" ? "#4CAF50" : "#2E7D32"
                            }
                            style={{ margin: 0 }}
                        />
                        <Text
                            style={[
                                styles.distanceText,
                                { color: subTextColor },
                            ]}
                        >
                            {distance} km
                        </Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text
                            style={[styles.resultTitle, { color: textColor }]}
                        >
                            {item.displayName.text}
                        </Text>
                        <Text
                            style={[
                                styles.resultAddress,
                                { color: subTextColor },
                            ]}
                        >
                            {item.formattedAddress}
                        </Text>
                    </View>
                </View>
                <IconButton
                    icon="plus"
                    size={24}
                    iconColor={mapStyle === "dark" ? "#4CAF50" : "#2E7D32"}
                    onPress={() => handleSelectResult(item)}
                />
            </TouchableOpacity>
        );
    };

    const renderRouteItem = (node: AudioNode, index: number) => {
        if (isEditing) {
            return (
                <View
                    key={`edit-${node.id}-${index}`}
                    style={[
                        styles.editItem,
                        {
                            backgroundColor:
                                mapStyle === "dark" ? "#444" : "#eee",
                        },
                    ]}
                >
                    <View style={styles.editControls}>
                        <TouchableOpacity
                            onPress={() => moveNode(index, "up")}
                            disabled={index === 0}
                        >
                            <IconButton
                                icon="arrow-up"
                                size={20}
                                disabled={index === 0}
                                iconColor={
                                    mapStyle === "dark" ? "#fff" : "#000"
                                }
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => moveNode(index, "down")}
                            disabled={index === activeRoute.length - 1}
                        >
                            <IconButton
                                icon="arrow-down"
                                size={20}
                                disabled={index === activeRoute.length - 1}
                                iconColor={
                                    mapStyle === "dark" ? "#fff" : "#000"
                                }
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.editContent}
                        onPress={() => startRenaming(index)}
                    >
                        <Text
                            style={[
                                styles.routeItemText,
                                {
                                    color:
                                        mapStyle === "dark" ? "#fff" : "#000",
                                    flex: 1,
                                },
                            ]}
                        >
                            {index + 1}. {node.title}
                        </Text>
                        <IconButton
                            icon="pencil"
                            size={16}
                            iconColor={mapStyle === "dark" ? "#aaa" : "#666"}
                        />
                    </TouchableOpacity>

                    <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#f44336"
                        onPress={() => deleteNode(index)}
                    />
                </View>
            );
        }

        return (
            <View
                key={index}
                style={[
                    styles.routeItem,
                    {
                        backgroundColor: mapStyle === "dark" ? "#444" : "#eee",
                    },
                ]}
            >
                <Text
                    style={[
                        styles.routeItemText,
                        {
                            color: mapStyle === "dark" ? "#fff" : "#000",
                        },
                    ]}
                >
                    {index + 1}. {node.title}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar />

            <View style={styles.topBar}>
                {/* Search Bar Row */}
                <View style={styles.searchRow}>
                    <Searchbar
                        placeholder="Search for a place"
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            if (!text) setSearchResults([]); // Clear results on empty text
                        }}
                        value={searchQuery}
                        onSubmitEditing={handleSearch}
                        loading={isSearching}
                        style={[
                            styles.searchBar,
                            {
                                backgroundColor:
                                    mapStyle === "dark" ? "#333" : "#fff",
                            },
                        ]}
                        inputStyle={{
                            color: mapStyle === "dark" ? "#fff" : "#000",
                        }}
                        iconColor={mapStyle === "dark" ? "#fff" : "#000"}
                        placeholderTextColor={
                            mapStyle === "dark" ? "#aaa" : "#555"
                        }
                    />

                    <View style={{ width: 10 }} />
                    <View style={{ zIndex: 200 }}>
                        <View
                            style={{
                                width: 50,
                                height: 50,
                                justifyContent: "center",
                                alignItems: "center",
                                marginLeft: 5,
                            }}
                        >
                            {/* Menu Icon (fades out) */}
                            <Animated.View
                                style={menuIconStyle}
                                pointerEvents={isMenuOpen ? "none" : "auto"}
                            >
                                <IconButton
                                    icon="menu"
                                    mode="contained"
                                    containerColor={
                                        mapStyle === "dark" ? "#333" : "#fff"
                                    }
                                    iconColor={
                                        mapStyle === "dark" ? "#fff" : "#000"
                                    }
                                    size={32}
                                    onPress={toggleMenu}
                                    style={{ margin: 0 }}
                                />
                            </Animated.View>

                            {/* Close Icon (fades in) */}
                            <Animated.View
                                style={closeIconStyle}
                                pointerEvents={isMenuOpen ? "auto" : "none"}
                            >
                                <IconButton
                                    icon="close"
                                    mode="contained"
                                    containerColor={
                                        mapStyle === "dark" ? "#333" : "#fff"
                                    }
                                    iconColor={
                                        mapStyle === "dark" ? "#fff" : "#000"
                                    }
                                    size={32}
                                    onPress={toggleMenu}
                                    style={{ margin: 0 }}
                                />
                            </Animated.View>
                        </View>

                        {/* Dropdown Menu */}
                        <Animated.View
                            style={[
                                styles.menuDropdown,
                                {
                                    backgroundColor:
                                        mapStyle === "dark" ? "#333" : "#fff",
                                },
                                menuDropdownStyle,
                            ]}
                            pointerEvents={isMenuOpen ? "auto" : "none"}
                        >
                            <IconButton
                                icon="history"
                                iconColor={
                                    mapStyle === "dark" ? "#fff" : "#000"
                                }
                                size={24}
                                onPress={() => {
                                    selection();
                                    toggleMenu();
                                    setIsHistoryVisible(true);
                                }}
                            />
                            <IconButton
                                icon="cog"
                                iconColor={
                                    mapStyle === "dark" ? "#fff" : "#000"
                                }
                                size={24}
                                onPress={() => {
                                    selection();
                                    toggleMenu();
                                    onOpenSettings();
                                }}
                            />
                        </Animated.View>
                    </View>
                </View>

                {/* Search Results List */}
                {searchResults.length > 0 && (
                    <View
                        style={[
                            styles.searchResultsContainer,
                            {
                                backgroundColor:
                                    mapStyle === "dark" ? "#333" : "#fff",
                            },
                        ]}
                    >
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id}
                            renderItem={renderSearchResultItem}
                            style={{ maxHeight: 300 }}
                        />
                    </View>
                )}
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

            {/* Floating Save Button */}
            {activeRoute.length > 0 && (
                <FAB
                    icon="content-save"
                    style={[
                        styles.fab,
                        {
                            borderRadius: 999,
                            backgroundColor: "#4CAF50",
                            bottom: 175,
                        },
                    ]}
                    onPress={handleSaveRoute}
                    color="#fff"
                />
            )}

            <View
                style={[
                    styles.selectionPanel,
                    {
                        backgroundColor: mapStyle === "dark" ? "#222" : "#fff",
                        height: isEditing ? "50%" : "auto",
                        maxHeight: isEditing ? "50%" : "100%",
                    },
                ]}
            >
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                    }}
                >
                    <Text
                        style={[
                            styles.panelTitle,
                            {
                                color: mapStyle === "dark" ? "#fff" : "#000",
                                marginBottom: 0,
                            },
                        ]}
                    >
                        Current Route ({activeRoute.length})
                    </Text>
                    <View style={{ flexDirection: "row" }}>
                        <TouchableOpacity
                            onPress={() => {
                                selection();
                                setIsEditing(!isEditing);
                            }}
                        >
                            <Text
                                style={{
                                    color: isEditing ? "#4CAF50" : "#2196F3",
                                    fontWeight: "bold",
                                }}
                            >
                                {isEditing ? "Done" : "Edit"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {isEditing ? (
                    <ScrollView
                        style={
                            (styles.routeListVertical,
                            { backgroundColor: "transparent" })
                        }
                    >
                        {activeRoute.map((node, i) => renderRouteItem(node, i))}
                    </ScrollView>
                ) : (
                    <ScrollView style={styles.routeList} horizontal>
                        {activeRoute.map((node, i) => renderRouteItem(node, i))}
                    </ScrollView>
                )}

                {isEditing ? null : (
                    <View style={styles.selectionButtons}>
                        <TouchableOpacity
                            style={[
                                styles.goButton,
                                { flex: 1 },
                                activeRoute.length === 0 && styles.disabledBtn,
                            ]}
                            onPress={onStartNavigation}
                            disabled={activeRoute.length === 0}
                        >
                            <Text style={styles.goButtonText}>GO</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* History Modal */}
            <Portal>
                <Modal
                    visible={isHistoryVisible}
                    onDismiss={() => setIsHistoryVisible(false)}
                    contentContainerStyle={[
                        styles.modalContent,
                        {
                            backgroundColor:
                                mapStyle === "dark" ? "#333" : "#fff",
                        },
                        {
                            // height: "45%",
                            maxHeight: "100%",
                        },
                        {
                            display: "flex",
                            justifyContent: "space-between",
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.modalTitle,
                            { color: mapStyle === "dark" ? "#fff" : "#000" },
                        ]}
                    >
                        Route History
                    </Text>
                    {isLoading ? (
                        <Text
                            style={{
                                color: mapStyle === "dark" ? "#ccc" : "#666",
                            }}
                        >
                            Loading history...
                        </Text>
                    ) : history.length === 0 ? (
                        <Text
                            style={{
                                color: mapStyle === "dark" ? "#ccc" : "#666",
                            }}
                        >
                            No saved routes yet.
                        </Text>
                    ) : (
                        <FlatList
                            data={history}
                            keyExtractor={(item) => item.id}
                            style={{ height: 200 }}
                            renderItem={({ item }) => (
                                <List.Item
                                    title={item.name}
                                    description={`${item.nodes.length} stops • ${new Date(item.createdAt).toLocaleDateString()}`}
                                    titleStyle={{
                                        color:
                                            mapStyle === "dark"
                                                ? "#fff"
                                                : "#000",
                                    }}
                                    descriptionStyle={{
                                        color:
                                            mapStyle === "dark"
                                                ? "#ccc"
                                                : "#666",
                                    }}
                                    left={(props) => (
                                        <List.Icon
                                            {...props}
                                            icon="map-marker-path"
                                            color={
                                                mapStyle === "dark"
                                                    ? "#fff"
                                                    : "#000"
                                            }
                                        />
                                    )}
                                    right={(props) => (
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                maxWidth: "100%",
                                                width: 100,
                                            }}
                                        >
                                            <Button
                                                mode="contained"
                                                onPress={() => loadRoute(item)}
                                                style={{ marginLeft: 10 }}
                                                buttonColor={
                                                    mapStyle === "dark"
                                                        ? "#000"
                                                        : "#fff"
                                                }
                                            >
                                                <List.Icon
                                                    icon="map-marker-path"
                                                    color={
                                                        mapStyle === "dark"
                                                            ? "#fff"
                                                            : "#000"
                                                    }
                                                />
                                            </Button>
                                            <IconButton
                                                icon="delete"
                                                size={20}
                                                style={{
                                                    marginLeft: 10,
                                                }}
                                                iconColor="#f44336"
                                                onPress={() =>
                                                    alrtDelete(item.id)
                                                }
                                            />
                                        </View>
                                    )}
                                />
                            )}
                        />
                    )}
                    <Button
                        mode="text"
                        onPress={() => setIsHistoryVisible(false)}
                        textColor="#ccccccff"
                        style={{
                            marginTop: 10,
                            borderColor: "#cccccc4c",
                            borderWidth: 1,
                            borderRadius: 5,
                            backgroundColor: "transparent",
                        }}
                    >
                        Close
                    </Button>
                </Modal>
            </Portal>

            {/* Rename Dialog */}
            <Portal>
                <Dialog
                    visible={renameDialogVisible}
                    onDismiss={() => setRenameDialogVisible(false)}
                    style={{
                        backgroundColor: mapStyle === "dark" ? "#333" : "#fff",
                    }}
                >
                    <Dialog.Title
                        style={{ color: mapStyle === "dark" ? "#fff" : "#000" }}
                    >
                        Rename Stop
                    </Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Name"
                            value={newName}
                            onChangeText={setNewName}
                            style={{
                                backgroundColor:
                                    mapStyle === "dark" ? "#444" : "#fff",
                            }}
                            textColor={mapStyle === "dark" ? "#fff" : "#000"}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setRenameDialogVisible(false)}>
                            Cancel
                        </Button>
                        <Button onPress={confirmRename}>Save</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    map: { flex: 1 },
    topBar: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: 15,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    searchBar: {
        flex: 1,
        borderRadius: 25,
        elevation: 3,
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
    routeListVertical: { maxHeight: 200, marginBottom: 15 },
    routeItem: {
        backgroundColor: "#eee",
        padding: 8,
        borderRadius: 10,
        marginRight: 10,
        justifyContent: "center",
        minWidth: 80,
    },
    editItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: "#eee",
    },
    editControls: {
        flexDirection: "column",
    },
    editContent: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
    },
    routeItemText: { fontSize: 14 },
    selectionButtons: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    goButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: "center",
    },
    disabledBtn: { backgroundColor: "#ccc" },
    goButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    callout: { padding: 5, alignItems: "center" },
    calloutTitle: { fontWeight: "bold", marginBottom: 5 },
    calloutBtn: { color: "#007AFF" },
    modalContent: {
        margin: 20,
        padding: 20,
        borderRadius: 10,
        maxHeight: "80%",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 220, // positioned above the panel (approx 200px height)
        backgroundColor: "#2196F3",
    },
    searchResultsContainer: {
        marginTop: 5,
        borderRadius: 10,
        elevation: 4,
        overflow: "hidden", // Ensure border radius clips content
    },
    searchResultItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: "rgba(100,100,100,0.2)",
    },
    searchResultLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    pinContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        minWidth: 40,
    },
    distanceText: {
        fontSize: 10,
        marginTop: -5,
    },
    textContainer: {
        flex: 1,
    },
    resultTitle: {
        fontWeight: "bold",
        fontSize: 15,
        marginBottom: 2,
    },
    resultAddress: {
        fontStyle: "italic",
        fontSize: 12,
    },
    menuDropdown: {
        position: "absolute",
        top: 60,
        right: 0,
        borderRadius: 25,
        paddingVertical: 5,
        alignItems: "center",
        zIndex: 199,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        maxHeight: 150,
        width: 50,
    },
});
