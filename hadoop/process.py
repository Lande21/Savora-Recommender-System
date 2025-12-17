import pandas as pd
import matplotlib.pyplot as plt

# Read CSV; adjust parameters if your CSV format requires it.
df = pd.read_csv('/data/mankato_restaurants.csv', header=None, 
                 names=['name','rating','review_count','price_range','categories','address','latitude','longitude','phone','url'])

# Convert rating to numeric and drop invalid rows.
df['rating'] = pd.to_numeric(df['rating'], errors='coerce')
df = df.dropna(subset=['rating'])

# Get top 10 restaurants by rating (descending)
top10 = df.sort_values(by='rating', ascending=False).head(10)

# Create a bar chart.
plt.figure(figsize=(10,6))
plt.bar(top10['name'], top10['rating'], color='skyblue')
plt.xticks(rotation=45, ha='right')
plt.ylabel('Rating (/5)')
plt.title('Top 10 Restaurants in Mankato by Rating')
plt.tight_layout()
plt.savefig('/output/top10.png')

# Additional output
print("Top 10 Restaurants:")
print(top10[['name', 'rating']])
print("Chart successfully saved to /output/top10.png")