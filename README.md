# FRC RAG (Frontend) - Retrieval-Augmented Generation for FIRST Robotics

A production-ready Retrieval-Augmented Generation (RAG) system designed for FIRST Robotics Competition teams. Features query processing, game piece mapping, caching, and scalable deployment architecture.

## Problem Statement

FRC teams often spend time creating new designs for mechanisms that other teams have already built successfully in past seasons. This happens because teams don't have an easy way to see what solutions already exist from previous competitions.

This project creates a searchable database that collects publicly shared technical documents from top-performing FRC teams across different seasons. The system uses RAG (Retrieval-Augmented Generation) technology to help users describe what they need and find relevant designs from past robots.

When teams search for solutions, the system looks through its collection to find mechanisms from earlier seasons that could work for current challenges. For example, a team looking for ways to pick up game pieces in the 2024 Reefscape season might discover that intake designs from the 2022 Rapid React cargo challenge could be modified to work with algae collection. The system shows pictures of actual robots and CAD drawings when available to help teams understand how the mechanisms work.

This tool helps FRC teams build on existing knowledge instead of starting from scratch, saving time and helping teams create better robots by learning from successful designs used by other teams.

## What makes FRC RAG different?

Users can upload documents, CAD files, and forum threads in real time, keeping the knowledge base up to date with current season innovations. The system uses multi-season mechanism retrieval and game-piece context mapping to return solutions that are truly relevant to the current challenge. With caching, rate limiting, and real-time monitoring, the platform is designed to be production-ready and deployable, so teams can integrate it into their workflow immediately

## Features

- **Query Processing**: Enhanced RAG system with FRC game piece context mapping

- **Caching**: Semantic and exact-match caching for 30-90% faster responses

- **Rate Limiting**: Configurable rate limits to prevent abuse (default: 60 requests/minute)

- **Real-time Monitoring**: Performance monitoring and usage statistics with cache hit rates

## Planned Additions

* **Dynamic Source Integration**: Real-time document upload capability letting users to add team publications, Chief Delphi threads, and other relevant resources directly to the database during their current session
* **Visual Search Results**: Multi-modal query responses that combine text solution descriptions with corresponding robot photos and CAD screenshots for complete technical understanding
* **Mobile Application**: iOS and Android app providing full platform functionality
* **Shareable Collaboration**: Link generation system enabling teams to share specific search results and findings through persistent URLs for quick information sharing