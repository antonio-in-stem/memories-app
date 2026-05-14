import json
import random
from datetime import datetime, timedelta

def generate_data():
    with open('data/profiles.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    profiles = data['profiles']
    usernames = [p['username'] for p in profiles]
    role_map = {p['username']: p['role'] for p in profiles}
    name_map = {p['username']: p['name'] for p in profiles}

    images = [
        "assets/memories/accessibility.webp",
        "assets/memories/analytics.webp",
        "assets/memories/api-contract.webp",
        "assets/memories/design-flow.webp",
        "assets/memories/integration.webp",
        "assets/memories/qa-notes.webp",
        "assets/memories/retro.webp",
        "assets/memories/team-handoff.webp"
    ]

    bodies_by_role = {
        "Frontend Developer": [
            "Simplified the component library, making it so much faster to build new views.",
            "Handled the complex state management for the dashboard without breaking a sweat.",
            "The way you handled the responsive layout for the legacy tables was impressive.",
            "Refactored the animation system. The UI feels much more fluid now.",
            "Fixed the cross-browser compatibility issues in the CSS grid. Life saver!",
            "Implemented the new dark mode theme. The contrast ratios are perfect.",
            "Caught a major performance bottleneck in the main bundle. Load times are down 20%."
        ],
        "QA Engineer": [
            "Found that critical edge case in the checkout flow before it hit production.",
            "The automated test suite you built for the mobile app is incredibly reliable.",
            "Detailed bug reports that actually help devs fix things faster. Thank you!",
            "Great job on the regression testing for the last-minute hotfix.",
            "Your testing plan for the internationalization rollout was flawless.",
            "Caught the security vulnerability in the form submission. Huge save.",
            "Verified the accessibility compliance for the entire user profile section."
        ],
        "Product Strategist": [
            "Your vision for the feature roadmap helped us prioritize the right things this quarter.",
            "Simplified the complex requirements into actionable user stories.",
            "Managed the stakeholder expectations perfectly during the pivot.",
            "The competitor analysis you shared was eye-opening and helped our strategy.",
            "Handled the product launch coordination with such precision.",
            "Turned a vague idea into a clear, measurable product goal.",
            "Your workshop on user value mapping was a highlight for the team."
        ],
        "Backend Developer": [
            "Optimized the SQL queries. The API response times are lightning fast now.",
            "Designed a robust data model for the new messaging service.",
            "Fixed the memory leak in the batch processing service. Great catch.",
            "The refactor of the authentication layer made it much more maintainable.",
            "Implemented the rate limiting perfectly. Staging is much more stable now.",
            "Your deep dive into the legacy code helped us finally decommission the old server.",
            "Set up the new Redis caching strategy. Significant performance boost."
        ],
        "UX Researcher": [
            "The user interview insights directly influenced the new navigation design.",
            "Your usability testing highlighted friction points we completely missed.",
            "Simplified the research findings into a narrative that everyone could follow.",
            "Great job on the card sorting exercise. The new information architecture is much clearer.",
            "The user personas you developed are used in every design meeting now.",
            "Found the 'why' behind the conversion drop through deep qualitative analysis.",
            "Your research on accessibility needs was essential for the project's success."
        ],
        "Product Designer": [
            "The new design system tokens make the UI feel so much more cohesive.",
            "Turned a complex workflow into a simple, three-step process. Pure magic.",
            "The prototype you built helped us get buy-in from the board instantly.",
            "Great attention to detail on the micro-interactions for the new cards.",
            "Your feedback on the spacing and alignment made the whole page 'click'.",
            "Designed an empty state that actually encourages users to take action.",
            "The way you handle design critiques with such openness is inspiring."
        ],
        "Scrum Master": [
            "Facilitated a great retrospective. The team feels heard and motivated.",
            "Cleared the blockers for the dev team before they even became issues.",
            "Kept the daily standup focused and productive. Best 15 minutes of the day.",
            "Your help in refining the backlog made the sprint planning so much smoother.",
            "Protected the team's capacity during a very hectic week. Thank you.",
            "Great at spotting team friction and resolving it before it escalated.",
            "Helped the product owner and the team find a common language."
        ],
        "Data Analyst": [
            "Your dashboard on user retention is a daily check for the whole team.",
            "Found the correlation between feature usage and churn that we were looking for.",
            "The data cleaning you did was a massive task. Results are much more reliable.",
            "Simplified the complex churn metrics into a single, understandable KPI.",
            "Your prediction model for the holiday surge was incredibly accurate.",
            "Helped the marketing team optimize the spend through attribution analysis.",
            "Great job explaining the statistical significance of the A/B test results."
        ],
        "Full Stack Developer": [
            "Handled the end-to-end implementation of the new profile settings.",
            "Fixed the bug that was spanning across the frontend and the database.",
            "Your contribution to both the React components and the Node services was vital.",
            "Implemented the real-time notifications using WebSockets flawlessly.",
            "Refactored the entire file upload flow, front to back. Much more robust.",
            "Broke down the monolithic service into manageable microservices.",
            "A true utility player who can jump into any part of the stack."
        ],
        "Visual Designer": [
            "The brand guidelines you developed are so clear and inspiring.",
            "The illustrations for the onboarding screens added so much personality.",
            "Your eye for color balance brought the landing page to life.",
            "Designed a set of icons that are both functional and beautiful.",
            "The social media assets you created are performing exceptionally well.",
            "Your work on the typography scales made the long-form content much more readable.",
            "A master of visual hierarchy. The information just flows."
        ],
        "DevOps Engineer": [
            "Automated the staging deployments, saving us hours every week.",
            "The infrastructure as code refactor was a massive task. Much safer now.",
            "Fixed the bottleneck in the build pipeline. Dev productivity is up.",
            "Your monitoring and alerting setup caught the spike before it hit production.",
            "Seamless migration of the database cluster to the new region.",
            "Set up the auto-scaling groups perfectly. Zero downtime during the peak.",
            "Hardened our server configurations. Security is much tighter now."
        ],
        "Mobile Developer": [
            "Optimized the app's startup time. It feels instant now.",
            "The offline sync logic you implemented is incredibly resilient.",
            "Fixed the tricky navigation bug in the iOS version. Great debugging.",
            "The way you handled the dynamic font sizes across different devices is perfect.",
            "Your implementation of the native animations makes the app feel premium.",
            "Resolved the battery drain issue. Users are much happier now.",
            "Great job porting the core features to the Android platform."
        ],
        "Security Engineer": [
            "Your audit of the third-party libraries caught a major vulnerability.",
            "Implemented the secret management system. Much more secure than env files.",
            "Great session on secure coding practices for the whole dev team.",
            "The penetration test results were so helpful for our roadmap.",
            "Simplified our encryption logic without losing any security.",
            "Handled the incident response with such calmness and precision.",
            "Your work on the identity provider integration was top notch."
        ],
        "Content Designer": [
            "The new copy for the landing page is so much more engaging and clear.",
            "Simplified the complex technical documentation for our users.",
            "Your work on the microcopy for the error messages is much more helpful.",
            "The content strategy for the new blog is already showing results.",
            "Helped us define a consistent voice across the whole product.",
            "Your feedback on the UI copy saved us from several confusing states.",
            "Turned a dry legal disclaimer into something human and understandable."
        ],
        "Business Analyst": [
            "Your analysis of the operational costs helped us find several savings.",
            "Documented the new business processes with such clarity.",
            "Helped bridge the gap between the finance team and the engineering team.",
            "The market research you provided was key for the new product launch.",
            "Turned the vague business requirements into detailed technical specs.",
            "Your work on the ROI calculations for the new feature was essential.",
            "A great bridge between the 'why' and the 'how'."
        ],
        "Platform Engineer": [
            "The new internal developer portal is a huge productivity boost.",
            "Refactored the core library used by all our services. Much cleaner.",
            "Set up the centralized logging system. Debugging is so much easier now.",
            "The way you manage our internal Kubernetes clusters is impressive.",
            "Your work on the service mesh simplified our network configuration.",
            "Automated the certificate renewal process. One less thing to worry about.",
            "Built a custom CLI tool that saves us time on every task."
        ],
        "Support Lead": [
            "Your feedback from the support frontlines is our most valuable asset.",
            "Managed the communication during the outage with such professionalism.",
            "The internal training you ran for the support team was excellent.",
            "Helped the product team understand the biggest pain points for our users.",
            "Your work on the knowledge base reduced our ticket volume by 15%.",
            "Always advocating for the user in our engineering meetings.",
            "Handled the difficult customer feedback with such empathy and patience."
        ]
    }

    comments_pool = [
        "This made my day! Thanks for the effort.",
        "Totally agree, great work.",
        "The impact of this was massive. Well done.",
        "I loved seeing how this developed.",
        "This is exactly why I love working with this team.",
        "So glad we have you on this.",
        "Spot on! This was a game changer.",
        "Incredible attention to detail.",
        "This made the whole sprint smoother.",
        "Always a pleasure to see your work.",
        "This was a life saver during the launch.",
        "Great insights here, thank you.",
        "This is a masterclass in this topic.",
        "Love the way this turned out.",
        "Thanks for the support on this!",
        "This is going straight into my inspiration folder.",
        "Legend! Thanks for the help.",
        "Couldn't have done it without you.",
        "This is the gold standard for this.",
        "Brilliant work as always."
    ]

    distribution = {
        "antonio-m": 8, "anaid-r": 5, "daniela-s": 7, "julio-c": 9, "cleyri-v": 6,
        "jose-l": 8, "luis-f": 5, "kim-n": 7, "nat-g": 6, "sam-p": 8, "azul-m": 4,
        "diego-p": 5, "edwin-r": 4, "erick-g": 4, "marina-a": 6, "paula-v": 7,
        "roberto-h": 6, "valeria-t": 5
    }

    start_date = datetime(2026, 3, 1)
    new_memories_count = 0
    total_comments_count = 0

    for profile in profiles:
        u = profile['username']
        count_to_add = distribution.get(u, 0)
        
        # Add comments to existing memories first
        for mem in profile['memories']:
            if len(mem['comments']) < 2:
                num_to_add = random.randint(1, 2)
                for _ in range(num_to_add):
                    author_comment = random.choice([x for x in usernames if x != u])
                    mem['comments'].append({
                        "profile": author_comment,
                        "body": random.choice(comments_pool),
                        "createdAt": (datetime.fromisoformat(mem['createdAt'].replace('Z', '+00:00')) + timedelta(hours=random.randint(1, 48))).isoformat().replace('+00:00', '.000Z')
                    })
                    total_comments_count += 1

        # Add new memories
        for i in range(count_to_add):
            new_memories_count += 1
            author = random.choice([x for x in usernames if x != u])
            author_role = role_map[author]
            
            # Pick a body that fits the author's role
            body = random.choice(bodies_by_role.get(author_role, ["Great collaboration on this project!"]))
            
            created_at = (start_date + timedelta(days=random.randint(0, 70), hours=random.randint(0, 23))).isoformat() + ".000Z"
            
            # Map image by role/body theme
            img = random.choice(images)
            if "design" in body.lower() or "UI" in body: img = "assets/memories/design-flow.webp"
            elif "data" in body.lower() or "analysis" in body.lower(): img = "assets/memories/analytics.webp"
            elif "API" in body or "database" in body.lower(): img = "assets/memories/api-contract.webp"
            elif "QA" in body or "test" in body.lower() or "bug" in body.lower(): img = "assets/memories/qa-notes.webp"
            elif "accessibility" in body.lower(): img = "assets/memories/accessibility.webp"
            elif "integration" in body.lower() or "pipeline" in body.lower(): img = "assets/memories/integration.webp"
            elif "retro" in body.lower() or "team" in body.lower(): img = "assets/memories/retro.webp"

            new_mem = {
                "id": f"{u}-from-{author}-{i+2:02d}",
                "author": author,
                "body": body,
                "image": img,
                "heartCount": random.randint(5, 50),
                "createdAt": created_at,
                "comments": []
            }
            
            # Add 1-3 comments to new memory
            num_comments = random.randint(1, 3)
            for _ in range(num_comments):
                author_comment = random.choice([x for x in usernames if x != u])
                new_mem['comments'].append({
                    "profile": author_comment,
                    "body": random.choice(comments_pool),
                    "createdAt": (datetime.fromisoformat(created_at.replace('Z', '+00:00')) + timedelta(hours=random.randint(1, 48))).isoformat().replace('+00:00', '.000Z')
                })
                total_comments_count += 1

            profile['memories'].append(new_mem)

    print(f"Added {new_memories_count} memories.")
    print(f"Total comments added: {total_comments_count}.")

    with open('data/profiles.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    generate_data()
