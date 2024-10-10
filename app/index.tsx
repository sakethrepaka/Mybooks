import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Button,
  Modal,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { useQuery, useMutation, gql } from "@apollo/client";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import { ActivityIndicator } from "react-native";

// Queries
const GET_AUTHORS = gql`
  query {
    Authors {
      id
      name
      nationality
      genre
    }
  }
`;

const ADD_AUTHOR = gql`
  mutation AddAuthor($name: String!, $nationality: String!, $genre: String!) {
    insert_Authors(
      objects: { name: $name, nationality: $nationality, genre: $genre }
    ) {
      returning {
        id
        name
        nationality
        genre
      }
    }
  }
`;

const UPDATE_AUTHOR = gql`
  mutation UpdateAuthor(
    $id: uuid!
    $name: String!
    $nationality: String!
    $genre: String!
  ) {
    update_Authors(
      where: { id: { _eq: $id } }
      _set: { name: $name, nationality: $nationality, genre: $genre }
    ) {
      returning {
        id
        name
        nationality
        genre
      }
    }
  }
`;

const DELETE_AUTHOR = gql`
  mutation DeleteAuthor($id: uuid!) {
    delete_Authors(where: { id: { _eq: $id } }) {
      affected_rows
    }
  }
`;

export default function Index() {
  const { loading, error, data, refetch } = useQuery(GET_AUTHORS);
  const [addAuthor] = useMutation(ADD_AUTHOR);
  const [updateAuthor] = useMutation(UPDATE_AUTHOR);
  const [deleteAuthor] = useMutation(DELETE_AUTHOR);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [deletemodalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState(null);
  const [editingAuthor, setEditingAuthor] = useState(null); // For editing
  const [newAuthor, setNewAuthor] = useState({
    name: "",
    nationality: "",
    genre: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data && data.Authors) {
      const filtered = data.Authors.filter((author) =>
        author.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAuthors(filtered);
    }
  }, [searchTerm, data]);

  const handleSearch = (text) => {
    setSearchTerm(text);
  };

  const handleInputChange = (field, value) => {
    setNewAuthor({ ...newAuthor, [field]: value });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!newAuthor.name || !newAuthor.nationality || !newAuthor.genre) {
      setFormError("All fields are required!");
      return;
    }

    setModalVisible(false);
    setIsSubmitting(true);

    try {
      if (editingAuthor) {
        await updateAuthor({
          variables: { id: selectedAuthorId, ...newAuthor },
        });
        setEditingAuthor(null);
      } else {
        // Add new author
        await addAuthor({ variables: newAuthor });
      }

      setNewAuthor({ name: "", nationality: "", genre: "" });
      await refetch();
      setIsSubmitting(false);
    } catch (error) {
      console.log(error);
      setFormError("Error processing request. Please try again.");
    }
  };

  const handleDeleteConfirmation = async () => {
    if (selectedAuthorId) {
      setDeleteModalVisible(false);
      setIsSubmitting(true);
      try {
        await deleteAuthor({ variables: { id: selectedAuthorId } });
        await refetch();
        setIsSubmitting(false);
      } catch (err) {
        console.error("Error deleting author:", err);
      }
      setSelectedAuthorId(null);
    }
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    setSelectedAuthorId(author.id);
    setNewAuthor({
      name: author.name,
      nationality: author.nationality,
      genre: author.genre,
    });
    setModalVisible(true);
  };

  const openDeleteModal = (id) => {
    setSelectedAuthorId(id);
    setDeleteModalVisible(true);
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00796b" />
        <Text style={styles.loadingText}>Fetching your authors 📚</Text>
      </View>
    );
  if (error)
    return <Text style={styles.errorText}>Error: {error.message}</Text>;

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Authors List</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by author name..."
            value={searchTerm}
            onChangeText={handleSearch}
          />
        </View>

        <Button
          title="Add New Author"
          onPress={() => {
            setEditingAuthor(null); // Reset editing state
            setModalVisible(true);
          }}
          color="#00796b"
        />

        <FlatList
          data={filteredAuthors.length > 0 ? filteredAuthors : data.Authors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link
              href={{
                pathname: "/[author]",
                params: { author: `${item.id}`, name: `${item.name}` },
              }}
              asChild
            >
              <Pressable>
                <View style={styles.itemContainer}>
                  <View>
                    <Text style={styles.authorName}>{item.name}</Text>
                    <Text style={styles.authorDetails}>
                      Genre: <Text style={styles.bold}>{item.genre}</Text>
                    </Text>
                    <Text style={styles.authorDetails}>
                      Nationality:{" "}
                      <Text style={styles.bold}>{item.nationality}</Text>
                    </Text>
                  </View>
                  <View style={styles.iconContainer}>
                    <TouchableOpacity onPress={() => openEditModal(item)}>
                      <Ionicons name="pencil-outline" size={24} color="blue" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openDeleteModal(item.id)}>
                      <Ionicons name="trash-outline" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            </Link>
          )}
        />

        {isSubmitting && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00796b" />
            <Text style={[styles.loadingText]}>Processing...</Text>
          </View>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingAuthor ? "Edit Author" : "Add New Author"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Author Name"
                value={newAuthor.name}
                placeholderTextColor="#888"
                onChangeText={(text) => handleInputChange("name", text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Nationality"
                placeholderTextColor="#888"
                value={newAuthor.nationality}
                onChangeText={(text) => handleInputChange("nationality", text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Genre"
                placeholderTextColor="#888"
                value={newAuthor.genre}
                onChangeText={(text) => handleInputChange("genre", text)}
              />
              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setNewAuthor({ name: "", nationality: "", genre: "" });
                    setFormError("");
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={deletemodalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { textAlign: "center" }]}>
                Are you sure you want to delete this author?
              </Text>
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.button, styles.submitButton]}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.button,
                    styles.submitButton,
                    { backgroundColor: "red" },
                  ]}
                  onPress={handleDeleteConfirmation}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#e0f7fa",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#e0f7fa",
    paddingTop: Platform.OS === "android" ? 45 : 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#00796b",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 25,
    paddingHorizontal: 10,
    marginBottom: 16,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    color: "#555",
  },
  loadingText: {
    textAlign: "center",
    color: "#00796b",
    fontSize: 22,
    marginTop: 10,
  },
  errorText: {
    textAlign: "center",
    color: "red",
    marginBottom: 5,
  },
  itemContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  authorName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004d40",
  },
  authorDetails: {
    fontSize: 16,
    marginTop: 4,
    color: "#444",
  },
  bold: {
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#00796b",
  },
  input: {
    height: 40,
    borderColor: "#00796b",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: "100%",
    backgroundColor: "#e0f7fa",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ff7043",
  },
  submitButton: {
    backgroundColor: "#00796b",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  iconContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
