import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
  Modal,
  TextInput,
  Button,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons"; // Import for icons

export default function AuthorScreen() {
  const GET_BOOKS_BY_AUTHOR = gql`
    query GetBooksByAuthor($authorId: uuid!) {
      Books(where: { author_id: { _eq: $authorId } }) {
        id
        summary
        title
        year
      }
    }
  `;

  const ADD_BOOK = gql`
    mutation AddBook(
      $title: String!
      $summary: String!
      $year: Int!
      $authorId: uuid!
    ) {
      insert_Books_one(
        object: {
          title: $title
          summary: $summary
          year: $year
          author_id: $authorId
        }
      ) {
        id
        title
      }
    }
  `;

  const UPDATE_BOOK = gql`
    mutation UpdateBook(
      $id: uuid!
      $title: String!
      $summary: String!
      $year: Int!
    ) {
      update_Books_by_pk(
        pk_columns: { id: $id }
        _set: { title: $title, summary: $summary, year: $year }
      ) {
        id
        title
      }
    }
  `;

  const DELETE_BOOK = gql`
    mutation DeleteBook($id: uuid!) {
      delete_Books_by_pk(id: $id) {
        id
      }
    }
  `;

  const params = useLocalSearchParams();
  const authorId = params.author;
  const authorName = params.name;
  const { loading, error, data, refetch } = useQuery(GET_BOOKS_BY_AUTHOR, {
    variables: { authorId },
  });

  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBookId, setCurrentBookId] = useState(null);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookSummary, setNewBookSummary] = useState("");
  const [newBookYear, setNewBookYear] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [formError, setFormError] = useState({
    title: "",
    summary: "",
    year: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addBook] = useMutation(ADD_BOOK, {
    onCompleted: async () => {
      await refetch();
      setIsSubmitting(false);
      resetForm();
    },
    onError: (error) => {
      setIsSubmitting(false);
      setSubmitError("Failed to add the book. Please try again.");
    },
  });

  const [updateBook] = useMutation(UPDATE_BOOK, {
    onCompleted: async () => {
      await refetch();
      setIsSubmitting(false);
      resetForm();
    },
    onError: (error) => {
      setIsSubmitting(false);
      setSubmitError("Failed to update the book. Please try again.");
    },
  });

  const [deleteBook] = useMutation(DELETE_BOOK, {
    onCompleted: async () => {
      await refetch();
      setIsSubmitting(false);
      setDeleteModalVisible(false);
    },
    onError: (error) => {
      setIsSubmitting(false);
      setSubmitError("Failed to delete the book. Please try again.");
    },
  });

  const resetForm = () => {
    setNewBookTitle("");
    setNewBookSummary("");
    setNewBookYear("");
    setFormError({ title: "", summary: "", year: "" });
    setSubmitError("");
    setIsEditing(false);
    setCurrentBookId(null);
  };

  const validateForm = () => {
    let isValid = true;
    let errors = { title: "", summary: "", year: "" };

    if (!newBookTitle.trim()) {
      errors.title = "Title is required.";
      isValid = false;
    }
    if (!newBookSummary.trim()) {
      errors.summary = "Summary is required.";
      isValid = false;
    }
    if (!newBookYear || isNaN(newBookYear)) {
      errors.year = "Valid published year is required.";
      isValid = false;
    }

    setFormError(errors);
    return isValid;
  };

  const handleAddOrUpdateBook = async () => {
    if (!validateForm()) {
      return;
    }

    setBookModalVisible(false);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateBook({
          variables: {
            id: currentBookId,
            title: newBookTitle,
            summary: newBookSummary,
            year: parseInt(newBookYear),
          },
        });
      } else {
        await addBook({
          variables: {
            title: newBookTitle,
            summary: newBookSummary,
            year: parseInt(newBookYear),
            authorId: authorId,
          },
        });
      }
    } catch (error) {
      console.error("Error adding/updating book:", error);
    }
  };

  const handleEditBook = (book) => {
    setIsEditing(true);
    setCurrentBookId(book.id);
    setNewBookTitle(book.title);
    setNewBookSummary(book.summary);
    setNewBookYear(book.year.toString());
    setBookModalVisible(true);
  };

  const handleDeleteBook = (book) => {
    setIsSubmitting(true);
    setBookToDelete(book);
    setDeleteModalVisible(true);
  };
  if (loading)
    return (
      <View style={styles.initialcontainer}>
        <ActivityIndicator size="large" color="#00796b" />
        <Text style={styles.loadingText}>Fecthing books my {authorName}</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.initialcontainer}>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Books by {authorName}</Text>
        {data?.Books.length === 0 ? (
          <Text style={styles.noRecordsText}>No records found</Text>
        ) : (
          <FlatList
            data={data?.Books}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookDetails}>{item.summary}</Text>
                <Text style={styles.bookYear}>Published Year: {item.year}</Text>
                <View style={styles.iconContainer}>
                  <TouchableOpacity
                    onPress={() => handleEditBook(item)}
                    style={styles.iconButton}
                  >
                    <MaterialIcons name="edit" size={24} color="blue" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteBook(item)}
                    style={styles.iconButton}
                  >
                    <MaterialIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {isSubmitting && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00796b" />
            <Text>Processing...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setBookModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Book</Text>
        </TouchableOpacity>

        <Modal
          visible={bookModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setBookModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Book" : "Add New Book"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Book Title"
                value={newBookTitle}
                onChangeText={(text) => setNewBookTitle(text)}
              />
              {formError.title ? (
                <Text style={styles.errorText}>{formError.title}</Text>
              ) : null}

              <TextInput
                style={styles.input}
                placeholder="Book Summary"
                value={newBookSummary}
                onChangeText={(text) => setNewBookSummary(text)}
              />
              {formError.summary ? (
                <Text style={styles.errorText}>{formError.summary}</Text>
              ) : null}

              <TextInput
                style={styles.input}
                placeholder="Published Year"
                keyboardType="numeric"
                value={newBookYear}
                onChangeText={(text) => setNewBookYear(text)}
              />
              {formError.year ? (
                <Text style={styles.errorText}>{formError.year}</Text>
              ) : null}

              {submitError ? (
                <Text style={styles.errorText}>{submitError}</Text>
              ) : null}

              <View style={styles.modalButtonContainer}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setBookModalVisible(false);
                    resetForm();
                  }}
                />
                <Button
                  title={isEditing ? "Update Book" : "Add Book"}
                  onPress={handleAddOrUpdateBook}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Are you sure you want to delete this book?
              </Text>
              <Text style={styles.bookTitle}>{bookToDelete?.title}</Text>
              <View style={styles.modalButtonContainer}>
                <Button
                  title="Cancel"
                  onPress={() => setDeleteModalVisible(false)}
                />
                <Button
                  title="Delete"
                  color="red"
                  onPress={() => {
                    setDeleteModalVisible(false);
                    deleteBook({ variables: { id: bookToDelete.id } });
                  }}
                />
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
    backgroundColor: "#00796b",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#e0f7fa",
    paddingTop: Platform.OS === "android" ? 50 : 0,
  },
  initialcontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#004d40",
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
    borderColor: "#00796b",
    borderWidth: 1,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004d40",
    textAlign: "center",
  },
  bookDetails: {
    fontSize: 14,
    marginTop: 4,
    color: "#424242",
  },
  bookYear: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: "italic",
    color: "#616161",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    color: "#00796b",
    fontSize: 22,
  },
  errorText: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 14,
    color: "#d32f2f",
  },
  noRecordsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 18,
    color: "#616161",
  },
  addButton: {
    backgroundColor: "#00796b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 18,
    color: "#ffffff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#004d40",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#004d40",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  iconButton: {
    marginHorizontal: 5,
    padding: 5,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    zIndex: 10,
  },
});
