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
} from "react-native-paper";
import { GOOGLE_MAPS_API_KEY } from "../config/config";
import {
    AudioNode,
    UserLocation,
    MapSelectionScreenProps,
    SavedRoute,
} from "../types";
import { useRouteHistory } from "../hooks/useRouteHistory";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const MapSelectionScreen: React.FC<MapSelectionScreenProps> = ({
    userLocation,
    audioNodes,
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

    // State
    const [temporaryPin, setTemporaryPin] = useState<AudioNode | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // History & Editing State
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Renaming
    const [renameDialogVisible, setRenameDialogVisible] = useState(false);
    const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
    const [newName, setNewName] = useState("");

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
        const { coordinate } = e.nativeEvent;
        // ...Existing Logic
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
    };

    const deleteNode = (index: number) => {
        const newRoute = [...activeRoute];
        newRoute.splice(index, 1);
        onUpdateRoute(newRoute);
    };

    const startRenaming = (index: number) => {
        setRenamingIndex(index);
        setNewName(activeRoute[index].title);
        setRenameDialogVisible(true);
    };

    const confirmRename = () => {
        if (renamingIndex !== null) {
            onUpdateNode(renamingIndex, { title: newName });
        }
        setRenameDialogVisible(false);
        setRenamingIndex(null);
        setNewName("");
    };

    const handleSaveRoute = async () => {
        await saveRoute(activeRoute);
        setIsHistoryVisible(true);
    };

    const loadRoute = (route: SavedRoute) => {
        onSetRoute(route.nodes);
        setIsHistoryVisible(false);
    };

    const handleClear = () => {
        onCancel();
        setSearchQuery("");
        setTemporaryPin(null);
    };

    // --- Render Helpers ---

    const renderRouteItem = (node: AudioNode, index: number) => {
        // ... (Item rendering logic same as before, simplified for diff brevity if using replace, but full here for write)
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
                {/* Search Bar Row with Clear Button */}
                <View style={styles.searchRow}>
                    {/* Clear Button (active if route has items or search has text) */}
                    {(activeRoute.length > 0 || searchQuery.length > 0) && (
                        <IconButton
                            icon="trash-can-outline"
                            size={24}
                            iconColor="#ff5252"
                            containerColor={
                                mapStyle === "dark" ? "#333" : "#fff"
                            }
                            onPress={handleClear}
                            style={styles.clearBtn}
                        />
                    )}

                    <Searchbar
                        placeholder="Search for a place"
                        onChangeText={setSearchQuery}
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

                    <IconButton
                        icon="history"
                        mode="contained"
                        containerColor={mapStyle === "dark" ? "#333" : "#fff"}
                        iconColor={mapStyle === "dark" ? "#fff" : "#000"}
                        size={24}
                        onPress={() => setIsHistoryVisible(true)}
                        style={{ marginLeft: 5 }}
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
                {/* ... (Same markers logic) ... */}
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
                    style={styles.fab}
                    onPress={handleSaveRoute}
                    variant="primary"
                    color="#fff"
                />
            )}

            <View
                style={[
                    styles.selectionPanel,
                    {
                        backgroundColor: mapStyle === "dark" ? "#222" : "#fff",
                        height: isEditing ? "50%" : "auto",
                        maxHeight: isEditing ? "50%" : 250,
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
                            onPress={() => setIsEditing(!isEditing)}
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
                    <ScrollView style={styles.routeListVertical}>
                        {activeRoute.map((node, i) => renderRouteItem(node, i))}
                    </ScrollView>
                ) : (
                    <ScrollView style={styles.routeList} horizontal>
                        {activeRoute.map((node, i) => renderRouteItem(node, i))}
                    </ScrollView>
                )}

                <View style={styles.selectionButtons}>
                    {/* "Clear" was removed from bottom, now we just have Go */}

                    <TouchableOpacity
                        style={[
                            styles.goButton,
                            { flex: 1 },
                            activeRoute.length === 0 && styles.disabledBtn,
                        ]}
                        onPress={onStartNavigation}
                        disabled={activeRoute.length === 0}
                    >
                        <Text style={styles.goButtonText}>GO ▶</Text>
                    </TouchableOpacity>
                </View>
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
                            style={{ maxHeight: SCREEN_HEIGHT * 0.4 }} // Fix layout issue by limiting height
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
                                            }}
                                        >
                                            <IconButton
                                                icon="delete"
                                                size={20}
                                                iconColor="#f44336"
                                                onPress={() =>
                                                    deleteRoute(item.id)
                                                }
                                            />
                                            <Button
                                                mode="contained"
                                                onPress={() => loadRoute(item)}
                                                style={{ marginLeft: 5 }}
                                            >
                                                Load
                                            </Button>
                                        </View>
                                    )}
                                />
                            )}
                        />
                    )}
                    <Button
                        mode="text"
                        onPress={() => setIsHistoryVisible(false)}
                        style={{ marginTop: 10 }}
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
    clearBtn: {
        marginRight: 5,
        backgroundColor: "#fff",
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
});
