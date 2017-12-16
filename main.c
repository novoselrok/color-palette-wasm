#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <math.h>

#define VECTOR_LENGTH 4
#define MAX_ITER 10

void initialize_centers(int k, double* data, int length, double* centers) {
    for (int i = 0; i < k; i++) {
        int random_point = rand() % length;
        for (int j = 0; j < VECTOR_LENGTH; j++) {
            centers[i * VECTOR_LENGTH + j] = data[random_point * VECTOR_LENGTH + j];
        }
    }   
}

double distance(double* point1, double* point2) {
    double sum = 0;
    for (int i = 0; i < VECTOR_LENGTH; i++) {
        sum += pow(point1[i] - point2[i], 2);
    }
    return sqrt(sum);
}

int get_nearest_center(int k, double* point, double* centers) {
    double min_dist = distance(point, &centers[0]);
    int min_center_idx = 0;
    for (int i = 0; i < k; i++) {
        double dist = distance(point, &centers[i * VECTOR_LENGTH]);
        if (dist < min_dist) {
            min_dist = dist;
            min_center_idx = i;
        }
    }
    return min_center_idx;
}

void calculate_new_centers(int k, double* data, int length, double* centers, int* labels) {
    // Reset centers
    int* center_counts = malloc(sizeof(int) * k);

    for (int i = 0; i < k; i++) {
        for (int j = 0; j < VECTOR_LENGTH; j++) {
            centers[i * VECTOR_LENGTH + j] = 0.0;
        }
        center_counts[i] = 0;
    }

    for (int i = 0; i < length; i++) {
        center_counts[labels[i]]++;
        for (int j = 0; j < VECTOR_LENGTH; j++) {
            centers[labels[i] * VECTOR_LENGTH + j] += data[i * VECTOR_LENGTH + j];
        }
    }

    for (int i = 0; i < k; i++) {
        for (int j = 0; j < VECTOR_LENGTH; j++) {
            if (center_counts[i] > 0) {            
                centers[i * VECTOR_LENGTH + j] /= center_counts[i];
            }
        }
    }

    free(center_counts);
}

void kmeans(int k, double* data, int length, double* centers, int* labels) {
    srand(time(NULL));

    // Initialize random centers (TODO: Implement kmeans++)
    initialize_centers(k, data, length, centers);
    for (int iter = 0; iter < MAX_ITER; iter++) {    
        // For every data point calculate its nearest center and save it to labels
        double changedPoints = 0;
        for (int point = 0; point < length; point++) {
            int newLabel = get_nearest_center(k, &data[point * VECTOR_LENGTH], centers);
            if (newLabel != labels[point]) {
                changedPoints++;
            }
            labels[point] = newLabel;
        }

        if (changedPoints / length < 0.01) {
            break;
        }

        calculate_new_centers(k, data, length, centers, labels);
    }
}

void kmeans_from_js(int k, double* jsdata, int length, double* centers, int* labels) {
    kmeans(k, jsdata, length / VECTOR_LENGTH, centers, labels);
}   
