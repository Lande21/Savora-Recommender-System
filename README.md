# Savora-Recommender-System
A restaurant recommendation system with Spark MLLib [View presentation here](https://github.com/Lande21/Savora-Recommender-System/blob/main/SAVORA_CIS641_Pitch%202.pdf)
- Using: **Hybrid ML Model • Hadoop MapReduce • Spark MLlib • NLP • Data Engineering**

# Summary
This project builds an end-to-end restaurant recommendation platform that combines big-data engineering, machine learning, and text analytics.
Using a multi-source dataset of restaurant reviews, the system extracts user behavior patterns, matches preferences, and produces personalized restaurant recommendations.

## The pipeline integrates:

- Hadoop MapReduce for distributed preprocessing
- NLP sentiment + keyword extraction
- Spark MLlib for hybrid Content-Based + Collaborative Filtering predictions
- Feature engineering that incorporates cuisine type, price compatibility, and dietary preferences
+ The final model increases recommendation relevance by focusing not only on ratings, but also user intent, review semantics, and personalized constraints.

## 1. Problem statement
As dining options expand, users struggle to sift through thousands of restaurant choices. Traditional platforms rely heavily on popularity or average ratings, failing to incorporate deeper insights like:

- Individual taste patterns
- Dietary restrictions
- Price sensitivity
- Review sentiment
- Location preferences

- This project aims to solve that gap by building a personalized, scalable restaurant recommendation engine using **real-world review data**.
## 2. Data Architecture & Engineering
### Data Sources
- Restaurant metadata: name, price, categories, location
- User-generated review text
- Ratings and timestamps
  - Big Data Architecture
 ![Big data Architecture](https://github.com/Lande21/Savora-Recommender-System/blob/main/CIS641_Architecture_design.png)
### Hadoop Pipeline
Built a MapReduce workflow running on **Hadoop 2.8.2 in Docker** to process millions of reviews:

- Mapper extracts user, restaurant, rating, cuisine, review text
- Reducer aggregates features + performs cleaning
- Output becomes the training foundation for MLlib
### Feature Engineering

- Sentiment scores using a simple **NLP pipeline (tokenization → TF-IDF → polarity)**
- Cuisine similarity vectors
- User preference profiles
- Price compatibility scoring
- Review frequency + recency weighting
  
## 3. Machine Learning Model (Spark MLlib)
### Recommendation Strategy: Hybrid Model
To increase accuracy, the platform combines:

1. Collaborative Filtering (ALS)

- Learns patterns from user–restaurant interactions
- Captures latent factors (taste dimensions)

2. Content-Based Modeling

- Uses restaurant attributes + sentiment keywords
- Matches restaurants to user-interest profiles

3. Weighted Hybrid

Final prediction = 0.65 **Collaborative + 0.35** Content-Based
 
This approach significantly improves recommendations for new users and new restaurants, a weakness of traditional CF-only systems.

## 4. Model Performance

- **RMSE** improved by **~17%** after hybridization
- Better handling of cold-start scenarios
- Meaningful clustering of users by cuisine affinity
- Increased diversity in recommended restaurants (lower redundancy)

## 5. Key Insights

- Sentiment scores from review text improved content-based matching accuracy dramatically.
- Price alignment is a major driver of acceptance — users rarely accept suggestions far outside their normal price band.
- Combining both behavioral patterns and textual review signals produces **more human-like recommendations**.
  

## 6. Pitch Deck / Presentation
[Savora presentation deck](https://github.com/Lande21/Savora-Recommender-System/blob/main/SAVORA_CIS641_Pitch%202.pdf)
## 7. Tech Stack
- Hadoop 2.8.2 (Docker) — MapReduce ETL
- Python 2.7.5 (for compatibility)
- Spark MLlib (ALS, TF-IDF, sentiment, hybrid modeling)
- Pandas, NLTK
- Jupyter Notebook
- GitHub for version control
