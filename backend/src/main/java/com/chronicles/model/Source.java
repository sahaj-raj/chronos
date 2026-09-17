package com.chronicles.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class Source {

    private String title;
    private String url;
    private String publisher;

    public Source() {}

    public Source(String title, String url, String publisher) {
        this.title = title;
        this.url = url;
        this.publisher = publisher;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String publisher) {
        this.publisher = publisher;
    }
}
